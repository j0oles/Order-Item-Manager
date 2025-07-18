/**
 * @File Name : OrderItemGridController.cls
 * @Description : Contrôleur Apex standard pour le composant OrderItemGrid
 * @Author : JBR
 * @Last Modified On : July 8, 2025
 * @Company : Vo2-Group
 * @Modification Log :
 * ==============================================================================
 * Ver | Date       | Author | Modification
 * ------------------------------------------------------------------------------
 * 1.0 | 2025-07-08 | JBR    | Version initiale sans dépendance métier
 **/

public with sharing class OrderItemGridController {

    // ============================================
    //     🔎 RÉCUPÉRATION DES ORDER ITEMS
    // ============================================
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getOrderItems(Id orderId) {
        System.debug('⚡️ [OrderItemGridController] START getOrderItems');

        if (String.isBlank(orderId)) {
            throw new AuraHandledException('Order ID is required.');
        }

        List<OrderItem> items = [
            SELECT Id, OrderId, Product2Id, Product2.Name, Product2.ProductCode,
                   UnitPrice, Quantity, TotalPrice, Status__c, Discount__c
            FROM OrderItem
            WHERE OrderId = :orderId
            AND Quantity != 0 AND Status__c != 'Inactive'
        ];

        List<Map<String, Object>> result = new List<Map<String, Object>>();

        for (OrderItem oi : items) {
            Map<String, Object> row = new Map<String, Object>();
            row.put('Id', oi.Id);
            row.put('OrderId', oi.OrderId);
            row.put('Product2Id', oi.Product2Id);
            row.put('ProductName', oi.Product2?.Name);
            row.put('ProductCode', oi.Product2?.ProductCode);
            row.put('UnitPrice', oi.UnitPrice);
            row.put('Quantity', oi.Quantity);
            row.put('TotalPrice', oi.TotalPrice);
            row.put('Status__c', oi.Status__c);
            row.put('Discount__c', oi.Discount__c);

            result.add(row);
        }

        System.debug('✅ [OrderItemGridController] OrderItems returned: ' + result.size());
		if (items.isEmpty()) {
			System.debug('🛑 Aucun OrderItem trouvé pour OrderId=' + orderId);
		} else {
			System.debug('📋 Nombre de lignes trouvées : ' + items.size());
			System.debug('🔍 Première ligne : ' + JSON.serialize(items[0]));
		}
        return result;
    }

    // ============================================
    //     💾 MISE À JOUR DES ORDER ITEMS
    // ============================================
    @AuraEnabled
    public static void updateOrderItems(String updatedJson) {
        System.debug('⚡️ [OrderItemGridController] START updateOrderItems');
        System.debug('📥 Données reçues : ' + updatedJson);

        if (String.isBlank(updatedJson)) {
            throw new AuraHandledException('Aucune donnée transmise pour la mise à jour.');
        }

        List<Object> rawList;
        try {
            rawList = (List<Object>) JSON.deserializeUntyped(updatedJson);
        } catch (Exception e) {
            throw new AuraHandledException('Erreur de parsing JSON : ' + e.getMessage());
        }

        List<OrderItem> toUpdate = new List<OrderItem>();

        for (Object obj : rawList) {
            Map<String, Object> row = (Map<String, Object>) obj;

            if (!row.containsKey('Id')) continue;

            OrderItem oi = new OrderItem();
            oi.Id = (String) row.get('Id');

            if (row.containsKey('Quantity')) {
                oi.Quantity = (Decimal) row.get('Quantity');
            }
            if (row.containsKey('Discount__c')) {
                oi.put('Discount__c', row.get('Discount__c'));
            }
            if (row.containsKey('Status__c')) {
                oi.put('Status__c', row.get('Status__c'));
            }

            toUpdate.add(oi);
        }

        if (toUpdate.isEmpty()) {
            throw new AuraHandledException('Aucune ligne à mettre à jour.');
        }

        try {
            update toUpdate;
            System.debug('✅ Mise à jour réussie : ' + toUpdate.size() + ' lignes.');
        } catch (Exception e) {
            throw new AuraHandledException('Erreur lors de la mise à jour : ' + e.getMessage());
        }

        System.debug('🏁 [OrderItemGridController] END updateOrderItems');
    }
}