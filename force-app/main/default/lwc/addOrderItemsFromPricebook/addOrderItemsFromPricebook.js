// 📁 File: addOrderItemsFromPricebook.js
// 📦 Description: Composant standard pour ajouter des OrderItems depuis des PricebookEntries

import { LightningElement, api, track } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

import { labels } from './addOrderItemFromPricebookLabels';

export default class AddOrderItemsFromPricebook extends LightningElement {
    // =======================
    // ⚙️ LABELS
    // =======================    
    labels = labels;    
    
    // ==========================
    //          INPUTS
    // ==========================
    @api inputCatalogPriceBookEntriesJson;
    @api outputDeltaJson;
    @api orderId;
    @api enableSearch = false;
    @api pageSizeInput = 10;

    // ==========================
    //         STATE
    // ==========================
    @track priceBookEntries = [];
    @track searchTerm = '';
    @track currentPage = 1;
    @track totalPages = 1;
    @track pageSize = 10;

    connectedCallback() {
        if (!this.inputCatalogPriceBookEntriesJson || typeof this.inputCatalogPriceBookEntriesJson !== 'string') {
            console.warn('⚠️ Donnée JSON absente ou invalide');
            this.priceBookEntries = [];
            return;
        }

        try {
            const rawData = JSON.parse(this.inputCatalogPriceBookEntriesJson);
            this.priceBookEntries = rawData.map((e, i) => {
                const quantity = e.Quantity || 0;
                const unitPrice = parseFloat(e.UnitPrice || 0);
                const discount = e.Discount__c || 0;
                const total = parseFloat((unitPrice * quantity * (1 - discount / 100)).toFixed(2));
                return {
                    id: e.Id || `pbe-${i}`,
                    pricebookEntryId: e.Id,
                    name: e.Name,
                    productCode: e.ProductCode,
                    unitPrice,
                    quantity,
                    discount__c: discount,
                    total,
                    isEditingDiscount: false
                };
            });
            this.pageSize = parseInt(this.pageSizeInput, 10) || 10;
            this.updatePaginationState();
        } catch (error) {
            console.error('❌ Erreur parsing JSON :', error);
            this.priceBookEntries = [];
        }
    }

    handlePlus(event) {
        const id = event.target.dataset.id;
        this.priceBookEntries = this.priceBookEntries.map(e => {
            if (e.id === id) {
                const newQty = e.quantity + 1;
                const total = parseFloat(e.unitPrice * newQty * (1 - e.discount__c / 100)).toFixed(2);
                return { ...e, quantity: newQty, total };
            }
            return e;
        });
        this.updateOutput();
    }

    handleMinus(event) {
        const id = event.target.dataset.id;
        this.priceBookEntries = this.priceBookEntries.map(e => {
            if (e.id === id) {
                const newQty = Math.max(0, e.quantity - 1);
                const total = parseFloat(e.unitPrice * newQty * (1 - e.discount__c / 100)).toFixed(2);
                return { ...e, quantity: newQty, total };
            }
            return e;
        });
        this.updateOutput();
    }

    handleEditDiscount(event) {
        const id = event.target.dataset.id;
        this.priceBookEntries = this.priceBookEntries.map(e => {
            if (e.id === id) e.isEditingDiscount = true;
            return e;
        });
    }

    handleDiscountChange(event) {
        const id = event.target.dataset.id;
        const value = parseFloat(event.target.value) || 0;
        this.priceBookEntries = this.priceBookEntries.map(e => {
            if (e.id === id) {
                const total = parseFloat(e.unitPrice * e.quantity * (1 - value / 100)).toFixed(2);
                return { ...e, discount__c: value, total };
            }
            return e;
        });
        this.updateOutput();
    }

    handleDiscountBlur(event) {
        const id = event.target.dataset.id;
        this.priceBookEntries = this.priceBookEntries.map(e => {
            if (e.id === id) e.isEditingDiscount = false;
            return e;
        });
    }

    get shouldShowDiscountColumn() {
        return this.filteredEntries.some(entry => entry.quantity > 0);
    }

    updateOutput() {
        const selected = this.priceBookEntries
            .filter(e => e.quantity > 0)
            .map(e => ({
                pricebookEntryId: e.pricebookEntryId,
                quantity: e.quantity,
                unitPrice: e.unitPrice,
                discount__c: e.discount__c,
                orderId: this.orderId
            }));

        this.outputDeltaJson = JSON.stringify(selected);
        this.dispatchEvent(new FlowAttributeChangeEvent('outputDeltaJson', this.outputDeltaJson));
    }

    updatePaginationState() {
        this.totalPages = Math.ceil(this.priceBookEntries.length / this.pageSize);
        this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));
    }

    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase();
    }

    get filteredEntries() {
        let filtered = this.priceBookEntries;
        if (this.searchTerm.trim()) {
            filtered = filtered.filter(e => e.name.toLowerCase().includes(this.searchTerm));
        }
        const start = (this.currentPage - 1) * this.pageSize;
        return filtered.slice(start, start + this.pageSize);
    }

    get hasNoResult() {
        return this.filteredEntries.length === 0;
    }

    get shouldShowPagination() {
        return this.totalPages > 1;
    }
}