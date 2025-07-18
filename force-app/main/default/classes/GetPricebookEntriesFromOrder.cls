/**
 * @File Name  : GetPricebookEntriesFromOrder.cls
 * @Author     : JBR
 * @Description: Invocable Apex pour retourner les PricebookEntry d'une commande au format JSON
 * @Last Modified By: JBR
 * @Last Modified On: 2025-07-09
 * @Company    : VO2-Group
 * -----------------------------------------------------------------------------
 * Version | Date       | Auteur   | Modifications
 * --------|------------|----------|--------------------------------------------
 * 1.0     | 2025-07-09 | JBR      | Version initiale
 */
public class GetPricebookEntriesFromOrder {

    public class Input {
        @InvocableVariable(required=true)
        public Id orderId;
    }

    public class Output {
        @InvocableVariable
        public String catalogJson;
    }

    @InvocableMethod(label='Récupérer les PricebookEntry JSON pour un Order')
    public static List<Output> getCatalog(List<Input> inputList) {
        System.debug('📥 [GetPricebookEntriesFromOrder] Start - Inputs: ' + inputList);

        if (inputList == null || inputList.isEmpty()) {
            throw new AuraHandledException('Aucun input reçu');
        }

        Id orderId = inputList[0].orderId;
        if (String.isBlank(orderId)) {
            throw new AuraHandledException('OrderId est requis.');
        }

        // 🔍 Récupère l’Order avec son Pricebook2Id
        Order ord = [SELECT Id, Pricebook2Id FROM Order WHERE Id = :orderId LIMIT 1];
        if (ord.Pricebook2Id == null) {
            throw new AuraHandledException('La commande ne possède pas de Pricebook associé.');
        }

        // 📦 Récupération des PBE actifs
        List<PricebookEntry> entries = [
            SELECT Id, Name, UnitPrice, Product2Id, Product2.ProductCode
            FROM PricebookEntry
            WHERE Pricebook2Id = :ord.Pricebook2Id
              AND IsActive = true
              AND Product2.IsActive = true
        ];

        System.debug('✅ Nombre de PBE récupérés : ' + entries.size());

        // 🧩 Conversion en liste de Map
        List<Map<String, Object>> simplified = new List<Map<String, Object>>();
        for (PricebookEntry pbe : entries) {
            Map<String, Object> row = new Map<String, Object>{
                'Id'           => pbe.Id,
                'Name'         => pbe.Name,
                'UnitPrice'    => pbe.UnitPrice,
                'Product2Id'   => pbe.Product2Id,
                'ProductCode'  => pbe.Product2?.ProductCode
            };
            simplified.add(row);
        }

        // 🔄 Sérialisation JSON
        String json = JSON.serialize(simplified);
        System.debug('📤 JSON généré : ' + json);

        Output output = new Output();
        output.catalogJson = json;
        return new List<Output>{ output };
    }
}