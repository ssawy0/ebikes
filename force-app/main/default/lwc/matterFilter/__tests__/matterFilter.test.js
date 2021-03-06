import { createElement } from 'lwc';
import MatterFilter from 'c/matterFilter';
import {
    registerLdsTestWireAdapter,
    registerTestWireAdapter
} from '@salesforce/sfdx-lwc-jest';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { publish, MessageContext } from 'lightning/messageService';
import MATTERS_FILTERED_MESSAGE from '@salesforce/messageChannel/MattersFiltered__c';

/*
 * Import a snapshot of getPicklistValues' response for functional verification. This eliminates
 * the need to connect to an org to retrieve data, which allows for running all unit tests
 * on localhost (aka offline).
 *
 * This data can be captured using a REST client accessing the UI API resource which the
 * @wire(getPicklistValues) represents:
 * /ui-api/object-info/{objectApiName}/picklist-values/{recordTypeId}/{fieldApiName}
 * Documentation for this UI API resource is at
 * https://developer.salesforce.com/docs/atlas.en-us.uiapi.meta/uiapi/ui_api_resources_picklist_values.htm
 *
 * Community-provided instructions for access Salesforce REST resources is at
 * https://blog.mkorman.uk/using-postman-to-explore-salesforce-restful-web-services/
 */
const mockGetPicklistValues = require('./data/getPicklistValues.json');

// Register as an LDS wire adapter. Some tests verify the provisioned values trigger desired behavior.
const getPicklistValuesAdapter = registerLdsTestWireAdapter(getPicklistValues);

// Register as a standard wire adapter because the component under test requires this adapter.
// We don't exercise this wire adapter in the tests.
registerTestWireAdapter(MessageContext);

describe('c-matter-filter', () => {
    beforeEach(() => {
        // Reset timer mocks
        jest.useFakeTimers();
    });

    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        // Prevent data saved on mocks from leaking between tests
        jest.clearAllMocks();
    });

    describe('filterChange event', () => {
        it('sends message when matter type value changes', () => {
            const expectedPrice = 500;
            const element = createElement('c-matter-filter', {
                is: MatterFilter
            });
            document.body.appendChild(element);

            const slider = element.shadowRoot.querySelector('lightning-slider');
            slider.value = expectedPrice;
            slider.dispatchEvent(new CustomEvent('change'));
            // Run timers eg setTimeout()
            jest.runAllTimers();

            // Only verify the relevant params
            const expectedFilters = {
                filters: {
                    maxPrice: expectedPrice,
                    searchKey: expect.any(String)
                }
            };
            expect(publish).toHaveBeenCalledWith(
                undefined,
                PRODUCTS_FILTERED_MESSAGE,
                expect.objectContaining(expectedFilters)
            );
        });

        it('sends message when search value changes', () => {
            const expectedSearchKey = 'search string';
            const element = createElement('c-product-filter', {
                is: ProductFilter
            });
            document.body.appendChild(element);

            const searchInput =
                element.shadowRoot.querySelector('lightning-input');
            searchInput.value = expectedSearchKey;
            searchInput.dispatchEvent(new CustomEvent('change'));
            // Run timers eg setTimeout()
            jest.runAllTimers();

            // Only verify the relevant params
            const expectedFilters = {
                filters: {
                    maxPrice: expect.any(Number),
                    searchKey: expectedSearchKey
                }
            };
            expect(publish).toHaveBeenCalledWith(
                undefined,
                PRODUCTS_FILTERED_MESSAGE,
                expect.objectContaining(expectedFilters)
            );
        });

        // eslint-disable-next-line jest/expect-expect
        it('sends messages when checkbox are toggled', () => {
            const element = createElement('c-product-filter', {
                is: ProductFilter
            });
            document.body.appendChild(element);

            getPicklistValuesAdapter.emit(mockGetPicklistValues);

            // Prepare expected filter values with default filters
            const expectedFilters = {
                filters: {
                    categories: ['MockValue'],
                    levels: ['MockValue'],
                    materials: ['MockValue'],
                    maxPrice: 10000,
                    searchKey: ''
                }
            };

            // Return a promise to wait for any asynchronous DOM updates. Jest
            // will automatically wait for the Promise chain to complete before
            // ending the test and fail the test if the promise ends in the
            // rejected state
            return Promise.resolve()
                .then(() => {
                    expectedFilters.filters.categories = [];
                    verifyFilterToggle(element, 'categories', expectedFilters);
                })
                .then(() => {
                    expectedFilters.filters.materials = [];
                    verifyFilterToggle(element, 'materials', expectedFilters);
                })
                .then(() => {
                    expectedFilters.filters.levels = [];
                    verifyFilterToggle(element, 'levels', expectedFilters);
                });
        });

        function verifyFilterToggle(element, filterName, expectedFilters) {
            const checkbox = element.shadowRoot.querySelector(
                `[data-filter="${filterName}"]`
            );
            checkbox.checked = false;
            checkbox.dispatchEvent(new CustomEvent('change'));
            // Filters are initialized to include all values emitted by getPicklistValuesAdapter, which is one item
            // per filter. Toggling it results in that filter being empty.
            expect(publish).toHaveBeenCalledWith(
                undefined,
                PRODUCTS_FILTERED_MESSAGE,
                expect.objectContaining(expectedFilters)
            );
        }
    });

    describe('getPicklistValues @wire error', () => {
        it('shows error message elements', () => {
            const element = createElement('c-product-filter', {
                is: ProductFilter
            });
            document.body.appendChild(element);

            getPicklistValuesAdapter.error();

            return Promise.resolve().then(() => {
                const messages =
                    element.shadowRoot.querySelectorAll('c-error-panel');
                // One error message per @wire
                expect(messages).toHaveLength(3);
            });
        });

        it.each(['categories', 'materials', 'levels'])(
            'does not render %s input options',
            (type) => {
                const element = createElement('c-product-filter', {
                    is: ProductFilter
                });
                document.body.appendChild(element);

                getPicklistValuesAdapter.error();

                return Promise.resolve().then(() => {
                    const input = element.shadowRoot.querySelector(
                        `[data-filter="${type}"]`
                    );
                    expect(input).toBeNull();
                });
            }
        );
    });
});
