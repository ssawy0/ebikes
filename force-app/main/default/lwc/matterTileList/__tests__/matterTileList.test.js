import { createElement } from 'lwc';
import MatterTileList from 'c/matterTileList';
import {
    registerTestWireAdapter,
    registerApexTestWireAdapter
} from '@salesforce/sfdx-lwc-jest';
import { publish, MessageContext } from 'lightning/messageService';
import MATTER_FILTERED_MESSAGE from '@salesforce/messageChannel/MattersFiltered__c';
import MATTER_SELECTED_MESSAGE from '@salesforce/messageChannel/MattersSelected__c';
import getMatters from '@salesforce/apex/MatterController.getMatters';

// Realistic data with multiple records
const mockGetMatters = require('./data/getMatters.json');
// An empty list of records to verify the component does something reasonable
// when there is no data to display
const mockGetMattersNoRecords = require('./data/getMattersNoRecords.json');

// Register the Apex wire adapter. Some tests verify that provisioned values trigger desired behavior.
const getMattersAdapter = registerApexTestWireAdapter(getMatters);

// Register as a standard wire adapter because the component under test requires this adapter.
// We don't exercise this wire adapter in the tests.
registerTestWireAdapter(MessageContext);

describe('c-matter-tile-list', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    describe('getMatter @wire emits records', () => {
        it('renders paginator with correct item counts', () => {
            const element = createElement('c-matter-tile-list', {
                is: MatterTileList
            });
            document.body.appendChild(element);
            getMattersAdapter.emit(mockGetMatters);

            // Return a promise to wait for any asynchronous DOM updates.
            return Promise.resolve().then(() => {
                const paginator =
                    element.shadowRoot.querySelector('c-paginator');
                expect(paginator).not.toBeNull();

                // paginator text will look something like: "12 items • page 1 of 2"
                const totalPages = Math.ceil(
                    mockGetMatters.totalItemCount / mockGetMatters.pageSize
                );
                const regex = new RegExp(
                    `${mockGetMatters.totalItemCount} items(.*)page ${mockGetMatters.pageNumber} of ${totalPages}`
                );
                expect(paginator.shadowRoot.textContent).toMatch(regex);
            });
        });

        it('increments/decrements page number when "next" and "previous" events fired', () => {
            const totalPages = Math.ceil(
                mockGetMatters.totalItemCount / mockGetMatters.pageSize
            );
            const element = createElement('c-matter-tile-list', {
                is: MatterTileList
            });
            document.body.appendChild(element);
            getMattersAdapter.emit(mockGetMatters);

            return Promise.resolve()
                .then(() => {
                    const paginator =
                        element.shadowRoot.querySelector('c-paginator');
                    paginator.dispatchEvent(new CustomEvent('next'));
                })
                .then(() => {
                    // DOM is updated after event is fired so need to wait
                    // another microtask for the rerender
                    const paginator =
                        element.shadowRoot.querySelector('c-paginator');
                    const currentPage =
                        parseInt(mockGetMatters.pageNumber, 10) + 1;
                    const regex = new RegExp(
                        `page ${currentPage} of ${totalPages}$`
                    );
                    expect(paginator.shadowRoot.textContent).toMatch(regex);

                    paginator.dispatchEvent(new CustomEvent('previous'));
                })
                .then(() => {
                    const paginator =
                        element.shadowRoot.querySelector('c-paginator');
                    // we're back to the original page number now
                    const regex = new RegExp(
                        `page ${mockGetMatters.pageNumber} of ${totalPages}$`
                    );
                    expect(paginator.shadowRoot.textContent).toMatch(regex);
                });
        });

        it('updates getMatters @wire with new pageNumber', () => {
            const element = createElement('c-matter-tile-list', {
                is: ProductTileList
            });
            document.body.appendChild(element);
            getMattersAdapter.emit(mockGetMatters);

            // Return a promise to wait for any asynchronous DOM updates.
            return Promise.resolve()
                .then(() => {
                    const paginator =
                        element.shadowRoot.querySelector('c-paginator');
                    paginator.dispatchEvent(new CustomEvent('next'));
                })
                .then(() => {
                    const { pageNumber } = getMattersAdapter.getLastConfig();
                    // we've fired a single 'next' event so increment the original pageNumber
                    expect(pageNumber).toBe(mockGetMatters.pageNumber + 1);
                });
        });

        it('displays one c-matter-tile per record', () => {
            const recordCount = mockGetMatters.records.length;
            const element = createElement('c-matter-tile-list', {
                is: MatterTileList
            });
            document.body.appendChild(element);
            getMattersAdapter.emit(mockGetMatters);

            return Promise.resolve().then(() => {
                const matterTiles =
                    element.shadowRoot.querySelectorAll('c-matter-tile');
                expect(matterTiles).toHaveLength(recordCount);
            });
        });

        it('sends matterSelected event when c-matter-tile selected', () => {
            const element = createElement('c-matter-tile-list', {
                is: MatterTileList
            });
            document.body.appendChild(element);
            getMattersAdapter.emit(mockGetMatters);

            return Promise.resolve().then(() => {
                const matterTile =
                    element.shadowRoot.querySelector('c-matter-tile');
                matterTile.dispatchEvent(new CustomEvent('selected'));
                expect(publish).toHaveBeenCalledWith(
                    undefined,
                    MATTER_SELECTED_MESSAGE,
                    {   matterId: null }
                );
            });
        });
    });

    describe('getMatter @wire emits empty list of records', () => {
        it('does not render paginator', () => {
            const element = createElement('c-matter-tile-list', {
                is: MatterTileList
            });
            document.body.appendChild(element);
            getMattersAdapter.emit(mockGetMattersNoRecords);

            return Promise.resolve().then(() => {
                const paginator =
                    element.shadowRoot.querySelector('c-paginator');
                expect(paginator).toBeNull();
            });
        });

        it('renders placeholder with no matters message', () => {
            const expected =
                'There are no matters matching your current selection';
            const element = createElement('c-matter-tile-list', {
                is: MatterTileList
            });
            document.body.appendChild(element);
            getMattersAdapter.emit(mockGetMattersNoRecords);

            return Promise.resolve().then(() => {
                const placeholder =
                    element.shadowRoot.querySelector('c-placeholder');
                expect(placeholder.shadowRoot.textContent).toBe(expected);
            });
        });
    });

    describe('getMatters @wire error', () => {
        it('shows error message element with error details populated', () => {
            // This is the default error message that gets emitted from apex
            // adapters. See @salesforce/wire-service-jest-util for the source.
            const defaultError = 'An internal server error has occurred';
            const element = createElement('c-matter-tile-list', {
                is: MatterTileList
            });
            document.body.appendChild(element);
            getMattersAdapter.error();
            return Promise.resolve()
                .then(() => {
                    const errorPanel =
                        element.shadowRoot.querySelector('c-error-panel');
                    // Click the "Show Details" link to render additional error messages
                    const lightningInput =
                        errorPanel.shadowRoot.querySelector('a');
                    lightningInput.dispatchEvent(new CustomEvent('click'));
                })
                .then(() => {
                    const errorPanel =
                        element.shadowRoot.querySelector('c-error-panel');
                    const text = errorPanel.shadowRoot.textContent;
                    expect(text).toContain(defaultError);
                });
        });
    });

    describe('with search bar visible', () => {
        it('updates getMatters @wire with searchKey as filter when search bar changes', () => {
            const input = 'foo';
            const expected = { searchKey: input };
            const element = createElement('c-matter-tile-list', {
                is: MatterTileList
            });
            element.searchBarIsVisible = true;
            document.body.appendChild(element);
            getMattersAdapter.emit(mockGetMatters);

            return Promise.resolve()
                .then(() => {
                    const searchBar =
                        element.shadowRoot.querySelector('.search-bar');
                    searchBar.value = input;
                    searchBar.dispatchEvent(new CustomEvent('change'));
                })
                .then(() => {
                    const { filters } = getMattersAdapter.getLastConfig();
                    expect(filters).toEqual(expected);
                });
        });
    });

    describe('with filter changes', () => {
        it('updates matter list when filters change', () => {
            const element = createElement('c-matter-tile-list', {
                is: MatterTileList
            });
            document.body.appendChild(element);

            // Simulate filter change
            const mockMessage = {
                filters: { searchKey: 'mockValue', maxPrice: 666 }
            };
            publish(null, MATTERS_FILTERED_MESSAGE, mockMessage);

            // Check that wire gets called with new filters
            return Promise.resolve().then(() => {
                const { filters } = getMattersAdapter.getLastConfig();
                expect(filters).toEqual(mockMessage.filters);
            });
        });
    });

    it('is accessible when matters returned', () => {
        const element = createElement('c-matter-tile-list', {
            is: MatterTileList
        });

        document.body.appendChild(element);
        getMattersAdapter.emit(mockGetMatters);

        return Promise.resolve().then(() => expect(element).toBeAccessible());
    });

    it('is accessible when no matters returned', () => {
        const element = createElement('c-matter-tile-list', {
            is: MatterTileList
        });

        document.body.appendChild(element);
        getMattersAdapter.emit(mockGetMattersNoRecords);

        return Promise.resolve().then(() => expect(element).toBeAccessible());
    });

    it('is accessible when error returned', () => {
        const element = createElement('c-matter-tile-list', {
            is: MatterTileList
        });

        document.body.appendChild(element);
        getMattersAdapter.error();

        return Promise.resolve().then(() => expect(element).toBeAccessible());
    });
});
