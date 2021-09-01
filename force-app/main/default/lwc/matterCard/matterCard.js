import { LightningElement, wire } from 'lwc';

// Lightning Message Service and a message channel
import { NavigationMixin } from 'lightning/navigation';
import { subscribe, MessageContext } from 'lightning/messageService';
import MATTER_SELECTED_MESSAGE from '@salesforce/messageChannel/MattersSelected__c';

// Utils to extract field values
import { getFieldValue } from 'lightning/uiRecordApi';

// Matter__c Schema
import MATTER_OBJECT from '@salesforce/schema/Matter__c';
import NAME_FIELD from '@salesforce/schema/Matter__c.Name';
import MATTER_NUMBER_FIELD from '@salesforce/schema/Matter__c.Matter_Number__c';
import STAGE_FIELD from '@salesforce/schema/Matter__c.Stage__c';
import STATUS_FIELD from '@salesforce/schema/Matter__c.Status__c';
import STATUTE_FIELD from '@salesforce/schema/Matter__c.Statute__c';
import TYPE_FIELD from '@salesforce/schema/Matter__c.Type__c';
import SUBTYPE_FIELD from '@salesforce/schema/Matter__c.Subtype__c';

/**
 * Component to display details of a Matter__c.
 */
export default class MatterCard extends NavigationMixin(LightningElement) {
    // Exposing fields to make them available in the template
    matterName = NAME_FIELD;
    matterNumber = MATTER_NUMBER_FIELD;
    stageField = STAGE_FIELD;
    statusField = STATUS_FIELD;
    statuteField = STATUTE_FIELD;
    typeField = TYPE_FIELD;
    subtypeField = SUBTYPE_FIELD;

    // Id of Matter__c to display
    recordId;


    /** Load context for Lightning Messaging Service */
    @wire(MessageContext) messageContext;

    /** Subscription for MatterSelected Lightning message */
    matterSelectionSubscription;

    connectedCallback() {
        // Subscribe to MatterSelected message
        this.matterSelectionSubscription = subscribe(
            this.messageContext,
            MATTER_SELECTED_MESSAGE,
            (message) => this.handleMatterSelected(message.matterId)
        );
    }

    handleRecordLoaded(event) {
        const { records } = event.detail;
        const recordData = records[this.recordId];
        this.matterName = getFieldValue(recordData, NAME_FIELD);
        this.matterNumber = getFieldValue(recordData, MATTER_NUMBER_FIELD);
        this.stageField = getFieldValue(recordData, STAGE_FIELD);
        this.statuteField = getFieldValue(recordData, STATUTE_FIELD);
        this.typeField = getFieldValue(recordData, TYPE_FIELD);
        this.subtypeField = getFieldValue(recordData, SUBTYPE_FIELD);
    }

    /**
     * Handler for when a matter is selected. When `this.recordId` changes, the
     * lightning-record-view-form component will detect the change and provision new data.
     */
    handleMatterSelected(matterId) {
        this.recordId = matterId;
    }

    handleNavigateToRecord() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: MATTER_OBJECT.objectApiName,
                actionName: 'view'
            }
        });
    }
}
