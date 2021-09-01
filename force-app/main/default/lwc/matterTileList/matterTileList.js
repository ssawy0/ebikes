import { LightningElement, api, wire } from 'lwc';

// Lightning Message Service and message channels
import { publish, subscribe, MessageContext } from 'lightning/messageService';
import MATTERS_FILTERED_MESSAGE from '@salesforce/messageChannel/MattersFiltered__c';
import MATTER_SELECTED_MESSAGE from '@salesforce/messageChannel/MattersSelected__c';

// getProducts() method in ProductController Apex class
import getMatters from '@salesforce/apex/MatterController.getMatters';

/**
 * Container component that loads and displays a list of Product__c records.
 */
export default class MatterTileList extends LightningElement {
    /**
     * Whether to display the search bar.
     * TODO - normalize value because it may come as a boolean, string or otherwise.
     */
    @api searchBarIsVisible = false;

    /**
     * Whether the product tiles are draggable.
     * TODO - normalize value because it may come as a boolean, string or otherwise.
     */
    @api tilesAreDraggable = false;

    /** Current page in the product list. */
    pageNumber = 1;

    /** The number of items on a page. */
    pageSize;

    /** The total number of items matching the selection. */
    totalItemCount = 0;

    /** JSON.stringified version of filters to pass to apex */
    filters = {};

    /** Load context for Lightning Messaging Service */
    @wire(MessageContext) messageContext;

    /** Subscription for ProductsFiltered Lightning message */
    matterFilterSubscription;

    /**
     * Load the list of available products.
     */
    @wire(getMatters, { filters: '$filters', pageNumber: '$pageNumber' })
    matters;

    connectedCallback() {
        // Subscribe to MattersFiltered message
        this.matterFilterSubscription = subscribe(
            this.messageContext,
            MATTERS_FILTERED_MESSAGE,
            (message) => this.handleFilterChange(message)
        );
    }

    handleMatterSelected(event) {
        // Published MatterSelected message
        publish(this.messageContext, MATTER_SELECTED_MESSAGE, {
            matterId: event.detail
        });
    }

    handleSearchKeyChange(event) {
        this.filters = {
            searchKey: event.target.value.toLowerCase()
        };
        this.pageNumber = 1;
    }

    handleFilterChange(message) {
        this.filters = { ...message.filters };
        this.pageNumber = 1;
    }

    handlePreviousPage() {
        this.pageNumber = this.pageNumber - 1;
    }

    handleNextPage() {
        this.pageNumber = this.pageNumber + 1;
    }
}
