/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import {
	inFlowApiRequest,
	inFlowApiRequestAllItems,
	buildAddress,
	buildOrderItems,
	handleEmptyResponse,
} from '../../transport';
import { cleanObject, createReference } from '../../utils/helpers';

export const purchaseOrderOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['purchaseOrder'],
			},
		},
		options: [
			{
				name: 'Close',
				value: 'close',
				description: 'Close a purchase order',
				action: 'Close a purchase order',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new purchase order',
				action: 'Create a purchase order',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a purchase order',
				action: 'Delete a purchase order',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a purchase order by ID',
				action: 'Get a purchase order',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all purchase orders',
				action: 'Get all purchase orders',
			},
			{
				name: 'Get Receivings',
				value: 'getReceivings',
				description: 'Get receiving history for a PO',
				action: 'Get PO receivings',
			},
			{
				name: 'Receive',
				value: 'receive',
				description: 'Receive items against a PO',
				action: 'Receive PO items',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a purchase order',
				action: 'Update a purchase order',
			},
			{
				name: 'Void',
				value: 'void',
				description: 'Void a purchase order',
				action: 'Void a purchase order',
			},
		],
		default: 'get',
	},
];

export const purchaseOrderFields: INodeProperties[] = [
	// Purchase Order ID
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['purchaseOrder'],
				operation: ['get', 'update', 'delete', 'receive', 'close', 'void', 'getReceivings'],
			},
		},
		description: 'The unique identifier of the purchase order',
	},

	// Vendor for create
	{
		displayName: 'Vendor',
		name: 'vendor',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['purchaseOrder'],
				operation: ['create'],
			},
		},
		description: 'Vendor name or ID',
	},

	// Order Items for create
	{
		displayName: 'Order Items',
		name: 'orderItems',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				resource: ['purchaseOrder'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'items',
				displayName: 'Item',
				values: [
					{
						displayName: 'Product',
						name: 'productId',
						type: 'string',
						default: '',
						description: 'Product name or ID',
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						default: 1,
						description: 'Quantity to order',
					},
					{
						displayName: 'Unit Cost',
						name: 'unitCost',
						type: 'number',
						typeOptions: {
							numberPrecision: 2,
						},
						default: 0,
						description: 'Cost per unit',
					},
				],
			},
		],
		description: 'Line items for the purchase order',
	},

	// Return All
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['purchaseOrder'],
				operation: ['getAll'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},

	// Limit
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				resource: ['purchaseOrder'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},

	// Filters
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['purchaseOrder'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Open', value: 'Open' },
					{ name: 'Partially Received', value: 'PartiallyReceived' },
					{ name: 'Received', value: 'Received' },
					{ name: 'Void', value: 'Void' },
				],
				default: 'Open',
				description: 'Filter by order status',
			},
			{
				displayName: 'Vendor',
				name: 'vendor',
				type: 'string',
				default: '',
				description: 'Filter by vendor name or ID',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'dateTime',
				default: '',
				description: 'Filter orders from this date',
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'dateTime',
				default: '',
				description: 'Filter orders until this date',
			},
		],
	},

	// Receiving items
	{
		displayName: 'Receiving Items',
		name: 'receivingItems',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				resource: ['purchaseOrder'],
				operation: ['receive'],
			},
		},
		options: [
			{
				name: 'items',
				displayName: 'Item',
				values: [
					{
						displayName: 'Product',
						name: 'productId',
						type: 'string',
						default: '',
						description: 'Product name or ID',
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						default: 1,
						description: 'Quantity received',
					},
					{
						displayName: 'Location ID',
						name: 'locationId',
						type: 'string',
						default: '',
						description: 'Location to receive into',
					},
				],
			},
		],
		description: 'Items being received',
	},

	// Receiving options
	{
		displayName: 'Receiving Options',
		name: 'receivingOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['purchaseOrder'],
				operation: ['receive'],
			},
		},
		options: [
			{
				displayName: 'Receiving Date',
				name: 'receivingDate',
				type: 'dateTime',
				default: '',
				description: 'Date of receiving',
			},
			{
				displayName: 'Location ID',
				name: 'locationId',
				type: 'string',
				default: '',
				description: 'Default location to receive into',
			},
		],
	},

	// Additional fields for create
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['purchaseOrder'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Order Number',
				name: 'orderNumber',
				type: 'string',
				default: '',
				description: 'Custom PO number',
			},
			{
				displayName: 'Order Date',
				name: 'orderDate',
				type: 'dateTime',
				default: '',
				description: 'Date of the order',
			},
			{
				displayName: 'Expected Date',
				name: 'expectedDate',
				type: 'dateTime',
				default: '',
				description: 'Expected delivery date',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: 'USD',
				description: 'Order currency (3-letter code)',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Order notes',
			},
			{
				displayName: 'Shipping Address',
				name: 'shippingAddress',
				type: 'fixedCollection',
				default: {},
				options: [
					{
						name: 'address',
						displayName: 'Address',
						values: [
							{ displayName: 'Name', name: 'name', type: 'string', default: '' },
							{ displayName: 'Attention', name: 'attention', type: 'string', default: '' },
							{ displayName: 'Address Line 1', name: 'address1', type: 'string', default: '' },
							{ displayName: 'Address Line 2', name: 'address2', type: 'string', default: '' },
							{ displayName: 'City', name: 'city', type: 'string', default: '' },
							{ displayName: 'State/Province', name: 'stateProvince', type: 'string', default: '' },
							{ displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '' },
							{ displayName: 'Country', name: 'country', type: 'string', default: '' },
							{ displayName: 'Phone', name: 'phone', type: 'string', default: '' },
						],
					},
				],
			},
		],
	},

	// Update fields
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['purchaseOrder'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Vendor',
				name: 'vendor',
				type: 'string',
				default: '',
				description: 'Vendor name or ID',
			},
			{
				displayName: 'Order Date',
				name: 'orderDate',
				type: 'dateTime',
				default: '',
				description: 'Date of the order',
			},
			{
				displayName: 'Expected Date',
				name: 'expectedDate',
				type: 'dateTime',
				default: '',
				description: 'Expected delivery date',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: '',
				description: 'Order currency',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Order notes',
			},
		],
	},
];

export async function executePurchaseOrderOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'get': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/purchaseorders/${orderId}`);
			break;
		}

		case 'getAll': {
			const returnAll = this.getNodeParameter('returnAll', i) as boolean;
			const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
			const query: IDataObject = {};

			if (filters.status) {
				query['filter[status]'] = filters.status;
			}
			if (filters.vendor) {
				query['filter[vendor]'] = filters.vendor;
			}
			if (filters.startDate) {
				query.startDate = filters.startDate;
			}
			if (filters.endDate) {
				query.endDate = filters.endDate;
			}

			if (returnAll) {
				responseData = await inFlowApiRequestAllItems.call(this, 'GET', '/purchaseorders', {}, query);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(this, 'GET', '/purchaseorders', {}, query);
			}
			break;
		}

		case 'create': {
			const vendor = this.getNodeParameter('vendor', i) as string;
			const orderItemsData = this.getNodeParameter('orderItems', i, {}) as IDataObject;
			const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			const body: IDataObject = {
				vendor: createReference(vendor),
			};

			// Process order items
			if (orderItemsData.items && Array.isArray(orderItemsData.items)) {
				body.orderItems = buildOrderItems(orderItemsData.items as IDataObject[]);
			}

			// Process additional fields
			const simpleFields = ['orderNumber', 'orderDate', 'expectedDate', 'currency', 'notes'];
			for (const field of simpleFields) {
				if (additionalFields[field]) {
					body[field] = additionalFields[field];
				}
			}

			// Process shipping address
			if (additionalFields.shippingAddress) {
				const shippingData = additionalFields.shippingAddress as IDataObject;
				if (shippingData.address) {
					body.shippingAddress = buildAddress(shippingData.address as IDataObject);
				}
			}

			responseData = await inFlowApiRequest.call(this, 'POST', '/purchaseorders', cleanObject(body));
			break;
		}

		case 'update': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

			const body: IDataObject = {};

			if (updateFields.vendor) {
				body.vendor = createReference(updateFields.vendor as string);
			}

			const simpleFields = ['orderDate', 'expectedDate', 'currency', 'notes'];
			for (const field of simpleFields) {
				if (updateFields[field] !== undefined) {
					body[field] = updateFields[field];
				}
			}

			responseData = await inFlowApiRequest.call(this, 'PUT', `/purchaseorders/${orderId}`, cleanObject(body));
			break;
		}

		case 'delete': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'DELETE', `/purchaseorders/${orderId}`);
			responseData = handleEmptyResponse(responseData, 'delete');
			break;
		}

		case 'receive': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			const receivingItemsData = this.getNodeParameter('receivingItems', i, {}) as IDataObject;
			const receivingOptions = this.getNodeParameter('receivingOptions', i, {}) as IDataObject;

			const body: IDataObject = {};

			// Process receiving items
			if (receivingItemsData.items && Array.isArray(receivingItemsData.items)) {
				body.items = buildOrderItems(receivingItemsData.items as IDataObject[]);
			}

			if (receivingOptions.receivingDate) {
				body.receivingDate = receivingOptions.receivingDate;
			} else {
				body.receivingDate = new Date().toISOString();
			}

			if (receivingOptions.locationId) {
				body.location = { entityId: receivingOptions.locationId };
			}

			responseData = await inFlowApiRequest.call(this, 'POST', `/purchaseorders/${orderId}/receive`, cleanObject(body));
			break;
		}

		case 'close': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'POST', `/purchaseorders/${orderId}/close`);
			break;
		}

		case 'void': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'POST', `/purchaseorders/${orderId}/void`);
			break;
		}

		case 'getReceivings': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/purchaseorders/${orderId}/receivings`);
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Purchase Order resource`);
	}

	return responseData;
}
