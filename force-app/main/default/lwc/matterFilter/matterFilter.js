import { LightningElement, wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

// Product schema
import MATTER from '@salesforce/schema/Matter__c';
import TYPE_FIELD from '@salesforce/schema/Matter__c.Type__c';
import SUB_TYPE_FIELD from '@salesforce/schema/Matter__c.Subtype__c';
import STATUTE_FIELD from '@salesforce/schema/Matter__c.Statute__c';
import DECISION_DATE_FIELD from '@salesforce/schema/Matter__c.Decision_Date__c';
import STATUS from '@salesforce/schema/Matter__c.Status__c';

// Lightning Message Service and a message channel
import { publish, MessageContext } from 'lightning/messageService';
import MATTERS_FILTERED_MESSAGE from '@salesforce/messageChannel/MattersFiltered__c';

// The delay used when debouncing event handlers before firing the event
const DELAY = 350;

/**
 * Displays a filter panel to search for Product__c[].
 */
export default class MatterFilter extends LightningElement {
    searchKey = '';
    type = '';
    subtype='';
    statute='';
    stage='';
    beginningDecisionDate='';
    endingDecisionDate='';

    filters = {
        searchKey: '',
        beginningDecisionDate: '',
        endingDecisionDate: ''
    };

    @wire(MessageContext)
    messageContext;

    /**@wire(getPicklistValues, {
        recordTypeId: 'a041100000HjwzTAAR',
        fieldApiName: TYPE_FIELD
    })**/
    types= [{'label':'40 C.F.R. 1.25(e)','value':'40 C.F.R. 1.25(e)'},
             {'label':'Administrative Order','value':'Administrative Order'},
             {'label':'ADR','value':'ADR'},
             {'label':'CAFO (using 22.13(b) to simultaneously commence and conclude)','value':'CAFO (using 22.13(b) to simultaneously commence and conclude)r'},
             {'label':'CERCLA 106(b)','value':'CERCLA 106(b)'},
             {'label':'CERCLA 107(r) Agreement','value':'CERCLA 107(r) Agreement'},
             {'label':'CERCLA 122(h) Cost Recovery Settlement','value':'CERCLA 122(h) Cost Recovery Settlement'},
             {'label':'CERCLA Lien – 107(l)','value':'CERCLA Lien – 107(l)'},
             {'label':'CERCLA Prospective Purchaser Agreement','value':'CERCLA Prospective Purchaser Agreement'},
             {'label':'Complaint','value':'Complaint'},
             {'label':'EAJA','value':'EAJA'},
             {'label':'EEO','value':'EEO'},
             {'label':'Enforcement Appeals','value':'Enforcement Appeals'},
             {'label':'Federal Facility Compliance Agreement','value':'Federal Facility Compliance Agreement'},
             {'label':'Field Citation (RCRA – RUST/LUST)','value':'Field Citation (RCRA – RUST/LUST)'},
             {'label':'Improper Practice','value':'Improper Practice'},
             {'label':'Judicial Stipulated Penalty','value':'Judicial Stipulated Penalty'},
             {'label':'Notice of Determination (NOD)','value':'Notice of Determination (NOD)'},
             {'label':'Notice of Noncompliance (NON)','value':'Notice of Noncompliance (NON)'},
             {'label':'Notice of Refusal of Admission (FIFRA)','value':'Notice of Refusal of Admission (FIFRA)'},
             {'label':'Notice of Violation (NOV)','value':'Notice of Violation (NOV)'},
             {'label':'Other (Type)','value':'Other (Type)'},
             {'label':'Permit Appeals','value':'Permit Appeals'},
             {'label':'Quick Resolution','value':'Quick Resolution'},
             {'label':'Specially delegated by AdministratorEO','value':'Specially delegated by Administrator'},
             {'label':'Stop Sale, Use or Removal Order (SSURO) - FIFRA','value':'Stop Sale, Use or Removal Order (SSURO) - FIFRA'},
             {'label':'Sua Sponte','value':'Sua Sponte'},
    ];

    /**@wire(getPicklistValues, {
        recordTypeId: '01211000003FBGnAAO',
        fieldApiName: SUB_TYPE_FIELD
    })**/
    subtypes=[
        {'label':'CAFO','value':'CAFO'},
        {'label':'CAFO w/Compliance Order','value':'CAFO w/Compliance Order'},
        {'label':'CAFO w/SEP','value':'CAFO w/SEP'},
        {'label':'CAFO w/Injunctive Relief','value':'CAFO w/Injunctive Relief'},
        {'label':'no penalty','value':'no penalty'},
        {'label':'ESA','value':'ESA'},
        {'label':'ESA w/ Compliance','value':'ESA w/ Compliance'},
        {'label':'On Consent (AOC) Plan','value':'On Consent (AOC) Plan'},
        {'label':'Unilateral (UAO)','value':'Unilateral (UAO)'},
        {'label':'Emergency','value':'Emergency'},
        {'label':'Penalty only (w/proposed amount)','value':'EEOPenalty only (w/proposed amount)'},
        {'label':'Penalty only (notice pleading)','value':'Penalty only (notice pleading)'},
        {'label':'Penalty (proposed amount) w/ Compliance Order','value':'Penalty (proposed amount) w/ Compliance Order'},
        {'label':'Penalty (notice pleading) w/ Compliance Order','value':'Penalty (notice pleading) w/ Compliance Order'},
        {'label':'CAA (not 112(r))','value':'CAA (not 112(r))'},
        {'label':'CAA 112(r)','value':'CAA 112(r)'},
        {'label':'CWA','value':'ECW'},
        {'label':'CERCLA','value':'CERCLA'},
        {'label':'RCRA','value':'RCRA'},
        {'label':'SDWA','value':'EESDWAO'},
        {'label':'TSCA 207','value':'TSCA 207'}
    ];

    /**@wire(getPicklistValues, {
        recordTypeId: '01211000003FBGnAAO',
        fieldApiName: STATUTE_FIELD
    })**/
    statutes = [
        {'label':'Clean Air Act','value':'Clean Air Act'},
        {'label':'Clean Water Act','value':'Clean Water Act'},
        {'label':'Comprehensive Environmental Response Compensation and Liability Act','value':'Comprehensive Environmental Response Compensation and Liability Act'},
        {'label':'Emergency Planning and Community Right-to-Know Act','value':'Emergency Planning and Community Right-to-Know Act'},
        {'label':'Equal Access to Justice','value':'Equal Access to Justice'},
        {'label':'Equal Employment Opportunity','value':'Equal Employment Opportunity'},
        {'label':'Federal Insecticide Act','value':'Federal Insecticide Act'},
    ];
    
    handleSearchKeyChange(event) {
        this.filters.searchKey = event.target.value;
        this.delayedFireFilterChangeEvent();
    }

    handleStatuteChange(event) {
        const statuteValue = event.target.value;
        this.filters.type = statuteValue;
        this.delayedFireFilterChangeEvent();
    }

    handleTypeChange(event) {
        const typeValue = event.target.value;
        this.filters.type = typeValue;
        this.delayedFireFilterChangeEvent();
    }

    handleSubtypeChange(event) {
        const subtypeValue = event.target.value;
        this.filters.subtype = subtypeValue;
        this.delayedFireFilterChangeEvent();
    }

    handleStageChange(event) {
        const stageValue = event.target.value;
        this.filters.stage = stageValue;
        this.delayedFireFilterChangeEvent();
    }

    handleBeginningDecisionDateChange(event) {
        const decisionDate = event.target.value;
        this.filters.decisionDate = decisionDate;
        this.delayedFireFilterChangeEvent();
    }

    handleEndingDecisionDateChange(event) {
        const endingDecisionDate = event.target.value;
        this.filters.endingDecisionDate = endingDecisionDate;
        this.delayedFireFilterChangeEvent();
    }

    handleComboboxChange(event) {
        if (!this.filters.types) {
            // Lazy initialize filters with all values initially set
            this.filters.types = this.types.data.values.map(
                (item) => item.value
            );
            this.filters.subtypes = this.subtypes.data.values.map(
                (item) => item.value
            );
            this.filters.statutes = this.statutes.data.values.map(
                (item) => item.value
            );
        }

        const value = event.target.dataset.value;
        const filterArray = this.filters[event.target.dataset.filter];
        if (event.target.checked) {
            if (!filterArray.includes(value)) {
                filterArray.push(value);
            }
        } else {
            this.filters[event.target.dataset.filter] = filterArray.filter(
                (item) => item !== value
            );
        }
        // Published ProductsFiltered message
        publish(this.messageContext, MATTERS_FILTERED_MESSAGE, {
            filters: this.filters
        });
    }

    delayedFireFilterChangeEvent() {
        // Debouncing this method: Do not actually fire the event as long as this function is
        // being called within a delay of DELAY. This is to avoid a very large number of Apex
        // method calls in components listening to this event.
        window.clearTimeout(this.delayTimeout);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.delayTimeout = setTimeout(() => {
            // Published ProductsFiltered message
            publish(this.messageContext, MATTERS_FILTERED_MESSAGE, {
                filters: this.filters
            });
        }, DELAY);
    }
}
