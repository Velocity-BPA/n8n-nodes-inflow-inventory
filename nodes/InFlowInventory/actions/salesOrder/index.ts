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

export const salesOrderOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['salesOrder'],
			},
		},
		options: [
			{
				name: 'Add Payment',
				value: 'addPayment',
				description: 'Add a payment to an order',
				action: 'Add payment to order',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new sales order',
				action: 'Create a sales order',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a sales order',
				action: 'Delete a sales order',
			},
			{
				name: 'Fulfill',
				value: 'fulfill',
				description: 'Fulfill/ship a sales order',
				action: 'Fulfill a sales order',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a sales order by ID',
				action: 'Get a sales order',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all sales orders',
				action: 'Get all sales orders',
			},
			{
				name: 'Get Payments',
				value: 'getPayments',
				description: 'Get payments for an order',
				action: 'Get order payments',
			},
			{
				name: 'Get Shipments',
				value: 'getShipments',
				description: 'Get shipments for an order',
				action: 'Get order shipments',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a sales order',
				action: 'Update a sales order',
			},
			{
				name: 'Void',
				value: 'void',
				description: 'Void a sales order',
				action: 'Void a sales order',
			},
		],
		default: 'get',
	},
];

export const salesOrderFields: INodeProperties[] = [
	// Sales Order ID
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['salesOrder'],
				operation: ['get', 'update', 'delete', 'fulfill', 'void', 'addPayment', 'getPayments', 'getShipments'],
			},
		},
		description: 'The unique identifier of the sales order',
	},

	// Customer for create
	{
		displayName: 'Customer',
		name: 'customer',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['salesOrder'],
				operation: ['create'],
			},
		},
		description: 'Customer name or ID',
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
				resource: ['salesOrder'],
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
						description: 'Quantity ordered',
					},
					{
						displayName: 'Unit Price',
						name: 'unitPrice',
						type: 'number',
						typeOptions: {
							numberPrecision: 2,
						},
						default: 0,
						description: 'Price per unit',
					},
					{
						displayName: 'Discount',
						name: 'discount',
						type: 'number',
						typeOptions: {
							numberPrecision: 2,
						},
						default: 0,
						description: 'Discount amount',
					},
					{
						displayName: 'Location ID',
						name: 'locationId',
						type: 'string',
						default: '',
						description: 'Location to fulfill from',
					},
				],
			},
		],
		description: 'Line items for the order',
	},

	// Return All
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['salesOrder'],
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
				resource: ['salesOrder'],
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
				resource: ['salesOrder'],
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
					{ name: 'Partially Fulfilled', value: 'PartiallyFulfilled' },
					{ name: 'Fulfilled', value: 'Fulfilled' },
					{ name: 'Void', value: 'Void' },
				],
				default: 'Open',
				description: 'Filter by order status',
			},
			{
				displayName: 'Customer',
				name: 'customer',
				type: 'string',
				default: '',
				description: 'Filter by customer name or ID',
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

	// Payment fields for addPayment
	{
		displayName: 'Payment Amount',
		name: 'paymentAmount',
		type: 'number',
		typeOptions: {
			numberPrecision: 2,
		},
		required: true,
		default: 0,
		displayOptions: {
			show: {
				resource: ['salesOrder'],
				operation: ['addPayment'],
			},
		},
		description: 'Amount of the payment',
	},
	{
		displayName: 'Payment Options',
		name: 'paymentOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['salesOrder'],
				operation: ['addPayment'],
			},
		},
		options: [
			{
				displayName: 'Payment Date',
				name: 'paymentDate',
				type: 'dateTime',
				default: '',
				description: 'Date of the payment',
			},
			{
				displayName: 'Payment Method',
				name: 'paymentMethod',
				type: 'string',
				default: '',
				description: 'Method of payment (e.g., Cash, Credit Card)',
			},
			{
				displayName: 'Reference',
				name: 'reference',
				type: 'string',
				default: '',
				description: 'Payment reference number',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				default: '',
				description: 'Payment notes',
			},
		],
	},

	// Fulfillment options
	{
		displayName: 'Fulfillment Options',
		name: 'fulfillmentOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['salesOrder'],
				operation: ['fulfill'],
			},
		},
		options: [
			{
				displayName: 'Shipment Date',
				name: 'shipmentDate',
				type: 'dateTime',
				default: '',
				description: 'Date of shipment',
			},
			{
				displayName: 'Carrier',
				name: 'carrier',
				type: 'string',
				default: '',
				description: 'Shipping carrier',
			},
			{
				displayName: 'Tracking Number',
				name: 'trackingNumber',
				type: 'string',
				default: '',
				description: 'Shipment tracking number',
			},
			{
				displayName: 'Location ID',
				name: 'locationId',
				type: 'string',
				default: '',
				description: 'Location to ship from',
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
				resource: ['salesOrder'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Order Number',
				name: 'orderNumber',
				type: 'string',
				default: '',
				description: 'Custom order number',
			},
			{
				displayName: 'Order Date',
				name: 'orderDate',
				type: 'dateTime',
				default: '',
				description: 'Date of the order',
			},
			{
				displayName: 'Due Date',
				name: 'dueDate',
				type: 'dateTime',
				default: '',
				description: 'Payment due date',
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
			{
				displayName: 'Billing Address',
				name: 'billingAddress',
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
				resource: ['salesOrder'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Customer',
				name: 'customer',
				type: 'string',
				default: '',
				description: 'Customer name or ID',
			},
			{
				displayName: 'Order Date',
				name: 'orderDate',
				type: 'dateTime',
				default: '',
				description: 'Date of the order',
			},
			{
				displayName: 'Due Date',
				name: 'dueDate',
				type: 'dateTime',
				default: '',
				description: 'Payment due date',
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

export async function executeSalesOrderOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'get': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/salesorders/${orderId}`);
			break;
		}

		case 'getAll': {
			const returnAll = this.getNodeParameter('returnAll', i) as boolean;
			const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
			const query: IDataObject = {};

			if (filters.status) {
				query['filter[status]'] = filters.status;
			}
			if (filters.customer) {
				query['filter[customer]'] = filters.customer;
			}
			if (filters.startDate) {
				query.startDate = filters.startDate;
			}
			if (filters.endDate) {
				query.endDate = filters.endDate;
			}

			if (returnAll) {
				responseData = await inFlowApiRequestAllItems.call(this, 'GET', '/salesorders', {}, query);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(this, 'GET', '/salesorders', {}, query);
			}
			break;
		}

		case 'create': {
			const customer = this.getNodeParameter('customer', i) as string;
			const orderItemsData = this.getNodeParameter('orderItems', i, {}) as IDataObject;
			const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			const body: IDataObject = {
				customer: createReference(customer),
			};

			// Process order items
			if (orderItemsData.items && Array.isArray(orderItemsData.items)) {
				body.orderItems = buildOrderItems(orderItemsData.items as IDataObject[]);
			}

			// Process additional fields
			const simpleFields = ['orderNumber', 'orderDate', 'dueDate', 'currency', 'notes'];
			for (const field of simpleFields) {
				if (additionalFields[field]) {
					body[field] = additionalFields[field];
				}
			}

			// Process addresses
			if (additionalFields.shippingAddress) {
				const shippingData = additionalFields.shippingAddress as IDataObject;
				if (shippingData.address) {
					body.shippingAddress = buildAddress(shippingData.address as IDataObject);
				}
			}

			if (additionalFields.billingAddress) {
				const billingData = additionalFields.billingAddress as IDataObject;
				if (billingData.address) {
					body.billingAddress = buildAddress(billingData.address as IDataObject);
				}
			}

			responseData = await inFlowApiRequest.call(this, 'POST', '/salesorders', cleanObject(body));
			break;
		}

		case 'update': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

			const body: IDataObject = {};

			if (updateFields.customer) {
				body.customer = createReference(updateFields.customer as string);
			}

			const simpleFields = ['orderDate', 'dueDate', 'currency', 'notes'];
			for (const field of simpleFields) {
				if (updateFields[field] !== undefined) {
					body[field] = updateFields[field];
				}
			}

			responseData = await inFlowApiRequest.call(this, 'PUT', `/salesorders/${orderId}`, cleanObject(body));
			break;
		}

		case 'delete': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'DELETE', `/salesorders/${orderId}`);
			responseData = handleEmptyResponse(responseData, 'delete');
			break;
		}

		case 'fulfill': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			const fulfillmentOptions = this.getNodeParameter('fulfillmentOptions', i, {}) as IDataObject;

			const body: IDataObject = {};

			if (fulfillmentOptions.shipmentDate) {
				body.shipmentDate = fulfillmentOptions.shipmentDate;
			}
			if (fulfillmentOptions.carrier) {
				body.carrier = fulfillmentOptions.carrier;
			}
			if (fulfillmentOptions.trackingNumber) {
				body.trackingNumber = fulfillmentOptions.trackingNumber;
			}
			if (fulfillmentOptions.locationId) {
				body.location = { entityId: fulfillmentOptions.locationId };
			}

			responseData = await inFlowApiRequest.call(this, 'POST', `/salesorders/${orderId}/fulfill`, cleanObject(body));
			break;
		}

		case 'void': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'POST', `/salesorders/${orderId}/void`);
			break;
		}

		case 'addPayment': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			const paymentAmount = this.getNodeParameter('paymentAmount', i) as number;
			const paymentOptions = this.getNodeParameter('paymentOptions', i, {}) as IDataObject;

			const body: IDataObject = {
				amount: paymentAmount,
			};

			if (paymentOptions.paymentDate) {
				body.paymentDate = paymentOptions.paymentDate;
			} else {
				body.paymentDate = new Date().toISOString();
			}

			if (paymentOptions.paymentMethod) {
				body.paymentMethod = paymentOptions.paymentMethod;
			}
			if (paymentOptions.reference) {
				body.reference = paymentOptions.reference;
			}
			if (paymentOptions.notes) {
				body.notes = paymentOptions.notes;
			}

			responseData = await inFlowApiRequest.call(this, 'POST', `/salesorders/${orderId}/payments`, cleanObject(body));
			break;
		}

		case 'getPayments': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/salesorders/${orderId}/payments`);
			break;
		}

		case 'getShipments': {
			const orderId = this.getNodeParameter('orderId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/salesorders/${orderId}/shipments`);
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Sales Order resource`);
	}

	return responseData;
}
