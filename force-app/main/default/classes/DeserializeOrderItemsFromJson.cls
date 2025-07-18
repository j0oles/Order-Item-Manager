/**
* @File Name : DeserializeOrderItemsFromJson.cls
* @Description : Classe invocable pour convertir un JSON (output LWC) en liste d'OrderItem exploitables dans un Flow
* @Author : JBR
* @Last Modified By : JBR
* @Last Modified On : July 10, 2025
* @Modification Log :
*==============================================================================
* Ver | Date          | Author | Modification
*==============================================================================
* 1.0 | July 10, 2025 | JBR    | Version initiale
* 1.1 | July 10, 2025 | JBR    | Version Flow-compatible avec wrapper Output
* 1.2 | July 10, 2025 | JBR    | Détection dynamique Order vs OrderItem
**/

public with sharing class DeserializeOrderItemsFromJson {

    // ==========================
    // 🔽 INPUT WRAPPER
    // ==========================
    public class Input {
        @InvocableVariable(label='ID de l’enregistrement source (Order ou OrderItem)')
        public String recordId;

        @InvocableVariable(label='JSON des OrderItems sélectionnés')
        public String orderItemsJson;
    }

    // ==========================
    // 📤 OUTPUT WRAPPER
    // ==========================
    public class Output {
        @InvocableVariable(label='Liste d\'OrderItems à créer')
        public List<OrderItem> orderItems;
    }

    // ==========================
    // 🧠 MÉTHODE PRINCIPALE
    // ==========================
    @InvocableMethod(label='Désérialiser JSON vers OrderItems (compatible Order ou OrderItem)')
    public static List<Output> run(List<Input> inputList) {
        System.debug('🔽 START - Désérialisation JSON vers OrderItems');

        // ✅ Validation des entrées
        if (inputList == null || inputList.isEmpty()) {
            throw new AuraHandledException('Paramètre d’entrée manquant.');
        }

        Input input = inputList[0];
        String jsonInput = input.orderItemsJson;
        String recordId = input.recordId;

        if (String.isBlank(jsonInput) || String.isBlank(recordId)) {
            throw new AuraHandledException('L’ID d’enregistrement ou le JSON est manquant.');
        }

        // 🧠 Détection du type d’objet (Order ou OrderItem)
        String orderId;
        String keyPrefix = recordId.substring(0, 3);
        if (keyPrefix == Order.sObjectType.getDescribe().getKeyPrefix()) {
            orderId = recordId;
        } else if (keyPrefix == OrderItem.sObjectType.getDescribe().getKeyPrefix()) {
            OrderItem oi = [SELECT OrderId FROM OrderItem WHERE Id = :recordId LIMIT 1];
            orderId = oi.OrderId;
        } else {
            throw new AuraHandledException('Type d’enregistrement non pris en charge : ' + keyPrefix);
        }

        System.debug('🧾 Order ID utilisé : ' + orderId);

        List<OrderItem> itemsToCreate = new List<OrderItem>();

        try {
            List<Object> raw = (List<Object>) JSON.deserializeUntyped(jsonInput);
            System.debug('🔢 Nombre de lignes détectées : ' + raw.size());

            for (Object rowObj : raw) {
                Map<String, Object> row = (Map<String, Object>) rowObj;

                OrderItem oi = new OrderItem();
                oi.PricebookEntryId = (String) row.get('pricebookEntryId');
                oi.Quantity         = Decimal.valueOf(row.get('quantity') + '');
                oi.UnitPrice        = Decimal.valueOf(row.get('unitPrice') + '');
                oi.OrderId          = orderId;
                oi.Status__c        = 'Active';

                // ➕ Champs facultatifs
                if (row.containsKey('discount__c')) {
                    oi.put('Discount__c', row.get('discount__c'));
                }

                System.debug('🧾 Ligne ajoutée : ' + oi);
                itemsToCreate.add(oi);
            }

        } catch (Exception e) {
            System.debug('❌ Erreur de parsing JSON : ' + e.getMessage());
            throw new AuraHandledException('Erreur de désérialisation JSON : ' + e.getMessage());
        }

        // 📤 Output unique
        Output outputWrapper = new Output();
        outputWrapper.orderItems = itemsToCreate;

        System.debug('✅ FIN - Total OrderItems : ' + itemsToCreate.size());
        return new List<Output>{ outputWrapper };
    }
}