import { createElement } from 'lwc';
import MatterTile from 'c/matterTile';

describe('c-matter-tile', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('dragging sets matter as dataTransfer data', () => {
        const element = createElement('c-matter-tile', {
            is: MatterTile
        });
        // Emulate a DragEvent, jsdom does not implement this class yet
        const dragstartEvent = new CustomEvent('dragstart');
        dragstartEvent.dataTransfer = {
            setData: jest.fn()
        };
        const matter = {
            Id: 1,
            Name: 'Foo',
            Status: 'Active',
            Type: 'Administrative Order'
        };
        element.matter = matter;
        document.body.appendChild(element);

        const div = element.shadowRoot.querySelector('div');
        div.dispatchEvent(dragstartEvent);

        expect(dragstartEvent.dataTransfer.setData).toHaveBeenCalledWith(
            'matter',
            JSON.stringify(matter)
        );
    });

    it('clicking fires selected event', () => {
        const listener = jest.fn();
        const element = createElement('c-matter-tile', {
            is: MatterTile
        });
        element.addEventListener('selected', listener);
        element.matter = {
            Id: 1,
            Name: 'Foo',
            Status: 'Active',
            Type: 'Administrative Order'
        };
        document.body.appendChild(element);

        const anchor = element.shadowRoot.querySelector('a');
        anchor.click();

        expect(listener).toHaveBeenCalled();
    });

    it('is accessible', () => {
        const element = createElement('c-matter-tile', {
            is: MatterTile
        });

        element.matter = {
            Id: 1,
            Name: 'Foo',
            Status: 'Active',
            Type: 'Administrative Order'
        };
        document.body.appendChild(element);

        return Promise.resolve().then(() => expect(element).toBeAccessible());
    });
});
