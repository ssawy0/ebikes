public with sharing class MatterController {

    static Integer PAGE_SIZE = 9;

    public class Filters {
        @AuraEnabled
        public String searchKey { get; set; }
        @AuraEnabled
        public String[] types { get; set; }
        @AuraEnabled
        public String[] subtypes { get; set; }
        @AuraEnabled
        public String[] statutes { get; set; }
        @AuraEnabled
        public Date beginningDecisionDate{ get; set; }
        @AuraEnabled
        public Date endingDecisionDate{ get; set; }
        
    }

    @AuraEnabled(Cacheable=true)
    public static PagedResult getMatters(Filters filters, Integer pageNumber) {
        String key, whereClause = '';
        Date beginningDate;
        Date endingDate;
        String[] types, subtypes, statutes, stage, status, criteria = new List<String>{};
        if (filters != null) {
            beginningDate = filters.beginningDecisionDate;
            endingDate = filters.endingDecisionDate;
            types = filters.types;
            subtypes = filters.subtypes;
            statutes = filters.statutes;

            System.debug('Beginning Date: ' + beginningDate);
            System.debug('Ending Date: ' + endingDate);
            System.debug('Type: ' + types);
            System.debug('Subtype: ' + subtypes);
            System.debug('Statute: ' + statutes);
            
            if ( !String.isEmpty( filters.searchKey )) {
                key = '%' + filters.searchKey + '%';
                criteria.add('Name LIKE :key');
            }
            if ( filters.beginningDecisionDate != null ) {
                beginningDate = filters.beginningDecisionDate;
                criteria.add('Decision_Date__c >= :beginningDate');
            }
            if ( filters.endingDecisionDate != null ) {
                beginningDate = filters.endingDecisionDate;
                criteria.add('Decision_Date__c <= :endingDate');
            }
            if (filters.types != null) {
                types = filters.types;
                criteria.add('Type__c IN :types');
            }
            if (filters.subtypes != null) {
                subtypes = filters.subtypes;
                criteria.add('Subtype__c IN :subtypes');
            }
            if (filters.statutes != null) {
                statutes = filters.statutes;
                criteria.add('Statute__c IN :statutes');
            }
            if (criteria.size() > 0) {
                whereClause = 'WHERE ' + String.join(criteria, ' AND ');
            }
        }
        Integer pageSize = MatterController.PAGE_SIZE;
        Integer offset = (pageNumber - 1) * pageSize;
        PagedResult result = new PagedResult();
        result.pageSize = pageSize;
        result.pageNumber = pageNumber;

        System.debug( 'SELECT Id, Name, Matter_Number__c, Stage__c, Status__c, Statute__c, Type__c, Subtype__c FROM Matter__c ' +
        whereClause +
        ' WITH SECURITY_ENFORCED' +
        ' ORDER BY Name LIMIT :pageSize OFFSET :offset');
        
        result.totalItemCount = Database.countQuery(
            'SELECT count() FROM Matter__c ' + whereClause
        );
        result.records = Database.query(
            'SELECT Id, Name, Matter_Number__c, Stage__c, Status__c, Statute__c, Type__c, Subtype__c FROM Matter__c ' +
            whereClause +
            ' WITH SECURITY_ENFORCED' +
            ' ORDER BY Name LIMIT :pageSize OFFSET :offset'
        );
        return result;
    }
}
