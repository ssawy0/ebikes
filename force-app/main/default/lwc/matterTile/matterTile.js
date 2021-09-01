import { LightningElement, api } from 'lwc';

/**
 * A presentation component to display a Matter__c sObject. The provided
 * Matter__c data must contain all fields used by this component.
 */
export default class MatterTile extends LightningElement {
    /** Whether the tile is draggable. */
    @api draggable;

    _matter;
    /** Matter__c to display. */
    @api
    get matter() {
        return this._matter;
    }
    set matter(value) {
        this._matter = value;
        this.name = value.Name;
        this.type = value.Type__c;
        this.status = value.Status__c;
    }

    /** Matter__c field values to display. */
    status;
    name;
    type;

    handleClick() {
        const selectedEvent = new CustomEvent('selected', {
            detail: this.matter.Id
        });
        this.dispatchEvent(selectedEvent);
    }

    handleDragStart(event) {
        event.dataTransfer.setData('matter', JSON.stringify(this.matter));
    }
}
