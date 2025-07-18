// 📁 File: orderItemGrid.js
// 📦 Description: Composant standard de gestion des lignes de commande Salesforce (OrderItem)

import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

import getOrderItems from '@salesforce/apex/OrderItemGridController.getOrderItems';
import updateOrderItems from '@salesforce/apex/OrderItemGridController.updateOrderItems';

import { labels } from './orderItemGridLabels';

import STATUS_FIELD from '@salesforce/schema/Order.Status';
import TOTAL_FIELD from '@salesforce/schema/Order.TotalAmount';

const ORDER_FIELDS = [STATUS_FIELD, TOTAL_FIELD];

export default class OrderItemGrid extends LightningElement {
    // =======================
    // ⚙️ LABELS
    // =======================    
    labels = labels;
    
    // =======================
    // 🔗 API INPUTS
    // =======================
    @api recordId;
    @api flowApiName_addOrderItems = '';
    @api flowApiName_majOrderItems = '';
    @api enableQuantitySelector = false;
    @api quantityFieldApiName = 'Quantity';
    @api defaultQuantity = 1;

    // =======================
    // 🧠 STATE
    // =======================
    @track records = [];
    @track displayRecords = [];
    @track hasDraft = false;
    @track showModal = false;
    @track flowInputVariables = [];

    @track orderStatus;
    @track totalAmount;

    currentFlowApiName;
    wiredRecordsResult;
    wiredOrderResult;

    // =======================
    // 📊 LOAD DATA
    // =======================

    @wire(getRecord, { recordId: '$recordId', fields: ORDER_FIELDS })
    wiredOrder(result) {
        this.wiredOrderResult = result;
        const { data, error } = result;
        if (data) {
            this.orderStatus = getFieldValue(data, STATUS_FIELD);
            this.totalAmount = getFieldValue(data, TOTAL_FIELD);
        } else if (error) {
            console.error('❌ Erreur récupération commande :', error);
        }
    }

    @wire(getOrderItems, { orderId: '$recordId' })
    wiredOrderItems(result) {
        this.wiredRecordsResult = result;
        const { data, error } = result;

        if (data) {
            this.records = data
                .filter(row => row.Quantity >= 1 && row.Status__c !== 'Inactive')
                .map(row => {
                    const qty = row[this.quantityFieldApiName] || 0;
                    const discount = row.Discount__c || 0;
                    const unitPrice = parseFloat((row.UnitPrice || 0) * (1 - discount / 100)).toFixed(2);
                    const total = parseFloat(unitPrice * qty).toFixed(2);

                    return {
                        ...row,
                        [this.quantityFieldApiName]: qty,
                        Discount__c: discount,
                        UnitPrice: parseFloat(unitPrice),
                        TotalPrice: parseFloat(total),
                        DisplayPrice: row.UnitPrice,
                        isEditingDiscount: false,
                        originalQuantity: qty,
                        originalDiscount: discount,
                        originalStatus: row.Status__c,
                        isMarkedForDeletion: false
                    };
                });

            this.recomputeDisplayRecords();
        } else if (error) {
            console.error('❌ Erreur récupération OrderItems :', error);
            this.records = [];
            this.displayRecords = [];
        }
    }

    // =======================
    // 🔁 REFRESH GLOBAL
    // =======================
    async refreshAfterSave() {
        try {
            console.log('🔁 Appel refreshApex des OrderItems...');

            if (this.wiredRecordsResult) {
                const result = await refreshApex(this.wiredRecordsResult);
                const data = result.data;

                if (data) {
                    // 💡 Ré-application du mapping
                    this.records = data
                        .filter(row => row.Quantity >= 1 && row.Status__c !== 'Inactive')
                        .map(row => {
                            const qty = row[this.quantityFieldApiName] || 0;
                            const discount = row.Discount__c || 0;
                            const unitPrice = parseFloat((row.UnitPrice || 0) * (1 - discount / 100)).toFixed(2);
                            const total = parseFloat(unitPrice * qty).toFixed(2);

                            return {
                                ...row,
                                [this.quantityFieldApiName]: qty,
                                Discount__c: discount,
                                UnitPrice: parseFloat(unitPrice),
                                TotalPrice: parseFloat(total),
                                DisplayPrice: row.UnitPrice,
                                isEditingDiscount: false,
                                originalQuantity: qty,
                                originalDiscount: discount,
                                originalStatus: row.Status__c,
                                isMarkedForDeletion: false
                            };
                        });

                    this.recomputeDisplayRecords();
                }
            }

            if (this.wiredOrderResult) {
                console.log('🔁 Rafraîchissement de TotalAmount après Flow...');
                await refreshApex(this.wiredOrderResult);
            } else {
                console.warn('⚠️ wiredRecordsResult non initialisé — aucun refresh exécuté');
            }

            this.hasDraft = false;
        } catch (error) {
            console.error('❌ Erreur refreshApex, fallback reload :', error);
        }
    }

    // =======================
    // 🔁 RENDU
    // =======================
    recomputeDisplayRecords() {
        const isLocked = this.isOrderLocked;
        this.displayRecords = this.records.map(row => ({
            ...row,
            isQuantityRow: this.enableQuantitySelector && !isLocked
        }));
    }

    get isOrderLocked() {
        return this.orderStatus === 'Activated' || this.orderStatus === 'Activé';
    }

    get hasDisplayRecords() {
        return Array.isArray(this.displayRecords) && this.displayRecords.length > 0;
    }

    // =======================
    // 🎯 INTERACTIONS QUANTITÉ / REMISE
    // =======================
    handlePlus(event) {
        const recordId = event.target.dataset.id;
        this.records = this.records.map(row => {
            if (row.Id === recordId) {
                row[this.quantityFieldApiName] += 1;
                row.TotalPrice = parseFloat(row.UnitPrice * row[this.quantityFieldApiName]).toFixed(2);
            }
            return row;
        });
        this.updateDraftStatus();
        this.recomputeDisplayRecords();
    }

    handleMinus(event) {
        const recordId = event.target.dataset.id;
        this.records = this.records.map(row => {
            if (row.Id === recordId) {
                row[this.quantityFieldApiName] = Math.max(0, row[this.quantityFieldApiName] - 1);
                row.TotalPrice = parseFloat(row.UnitPrice * row[this.quantityFieldApiName]).toFixed(2);
            }
            return row;
        });
        this.updateDraftStatus();
        this.recomputeDisplayRecords();
    }

    handleEditDiscount(event) {
        const recordId = event.target.dataset.id;
        this.records = this.records.map(row => {
            if (row.Id === recordId) row.isEditingDiscount = true;
            return row;
        });
        this.hasDraft = true;
        this.recomputeDisplayRecords();
    }

    handleDiscountChange(event) {
        const recordId = event.target.dataset.id;
        const value = parseFloat(event.target.value);

        this.records = this.records.map(row => {
            if (row.Id === recordId) {
                const discount = isNaN(value) ? 0 : value;
                const listPrice = row.DisplayPrice || 0;
                const qty = row[this.quantityFieldApiName] || 0;
                row.Discount__c = discount;
                row.UnitPrice = parseFloat((listPrice * (1 - discount / 100)).toFixed(2));
                row.TotalPrice = parseFloat((row.UnitPrice * qty).toFixed(2));
                row.isEditingDiscount = false;
            }
            return row;
        });

        this.updateDraftStatus();
    }

    handleDelete(event) {
        const recordId = event.target.dataset.id;
        this.records = this.records.map(row => {
            if (row.Id === recordId) {
                row.isMarkedForDeletion = true;
            }
            return row;
        });
        this.updateDraftStatus();
        this.recomputeDisplayRecords();
    }

    // =======================
    // 💾 SAVE + REFRESH + CANCEL
    // =======================
    updateDraftStatus() {
        this.hasDraft = this.records.some(row =>
            row[this.quantityFieldApiName] !== row.originalQuantity ||
            row.Discount__c !== row.originalDiscount ||
            row.isMarkedForDeletion
        );
    }

    async handleSave() {
        const payload = this.records
            .filter(row =>
                row[this.quantityFieldApiName] !== row.originalQuantity ||
                row.Discount__c !== row.originalDiscount ||
                row.isMarkedForDeletion
            )
            .map(row => ({
                Id: row.Id,
                Quantity: row.isMarkedForDeletion ? 0 : row[this.quantityFieldApiName],
                Discount__c: row.Discount__c,
                Status__c: row.isMarkedForDeletion ? 'Inactive' : row.Status__c,
                UnitPrice: parseFloat((row.DisplayPrice || 0) * (1 - (row.Discount__c || 0) / 100))
            }));

        if (!payload.length) {
            this.showToast('Info', 'Aucune modification à enregistrer', 'info');
            return;
        }

        try {
            await updateOrderItems({ updatedJson: JSON.stringify(payload) });
            this.showToast('Succès', 'Lignes mises à jour avec succès.', 'success');
            this.hasDraft = false;
            await this.refreshAfterSave();
        } catch (error) {
            this.showToast('Erreur', error.body?.message || error.message, 'error');
        }
    }

    handleCancelAllChanges() {
        this.records = this.records.map(row => {
            const qty = row.originalQuantity;
            const discount = row.originalDiscount;
            const listPrice = row.DisplayPrice || 0;
            const unitPrice = parseFloat((listPrice * (1 - discount / 100)).toFixed(2));
            const total = parseFloat((unitPrice * qty).toFixed(2));

            return {
                ...row,
                [this.quantityFieldApiName]: qty,
                Discount__c: discount,
                Status__c: row.originalStatus,
                UnitPrice: unitPrice,
                TotalPrice: total,
                isEditingDiscount: false,
                isMarkedForDeletion: false
            };
        });

        this.hasDraft = false;
        this.recomputeDisplayRecords();
    }

    // =======================
    // 🔄 FLOW MODAL LOGIC
    // =======================
    handleClick() {
        this.flowInputVariables = [{ name: 'recordId', type: 'String', value: this.recordId }];
        this.currentFlowApiName = this.flowApiName_addOrderItems;
        this.showModal = true;
    }

    handleRowUpdate(event) {
        const recordId = event.target.dataset.id;
        this.flowInputVariables = [{ name: 'recordId', type: 'String', value: recordId }];
        this.currentFlowApiName = this.flowApiName_majOrderItems;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    async handleFlowStatusChange(event) {
        if (['FINISHED', 'FINISHED_SCREEN'].includes(event.detail.status)) {
            this.closeModal();
            await this.refreshAfterSave();
        }
    }

    // =======================
    // 🔔 UTILS
    // =======================
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}