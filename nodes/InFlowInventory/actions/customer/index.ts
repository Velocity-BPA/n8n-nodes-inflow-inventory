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
	handleEmptyResponse,
} from '../../transport';
import { cleanObject, createReference } from '../../utils/helpers';

export const customerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['customer'],
			},
		},
		options: [
			{
				name: 'Add Address',
				value: 'addAddress',
				description: 'Add an address to a customer',
				action: 'Add customer address',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new customer',
				action: 'Create a customer',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a customer',
				action: 'Delete a customer',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a customer by ID',
				action: 'Get a customer',
			},
			{
				name: 'Get Addresses',
				value: 'getAddresses',
				description: 'Get customer addresses',
				action: 'Get customer addresses',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all customers',
				action: 'Get all customers',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get customer balance',
				action: 'Get customer balance',
			},
			{
				name: 'Get Orders',
				value: 'getOrders',
				description: "Get customer's orders",
				action: 'Get customer orders',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a customer',
				action: 'Update a customer',
			},
		],
		default: 'get',
	},
];

export const customerFields: INodeProperties[] = [
	// Customer ID
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['get', 'update', 'delete', 'getOrders', 'getAddresses', 'addAddress', 'getBalance'],
			},
		},
		description: 'The unique identifier of the customer',
	},

	// Name for create
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['create'],
			},
		},
		description: 'Customer or company name',
	},

	// Return All
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['customer'],
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
				resource: ['customer'],
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
				resource: ['customer'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Smart Search',
				name: 'smart',
				type: 'string',
				default: '',
				description: 'Search across name and email fields',
			},
			{
				displayName: 'Active Only',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether to return only active customers',
			},
		],
	},

	// Address fields for addAddress
	{
		displayName: 'Address',
		name: 'address',
		type: 'fixedCollection',
		default: {},
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['addAddress'],
			},
		},
		options: [
			{
				name: 'addressDetails',
				displayName: 'Address Details',
				values: [
					{ displayName: 'Name', name: 'name', type: 'string', default: '' },
					{ displayName: 'Attention', name: 'attention', type: 'string', default: '' },
					{ displayName: 'Address Line 1', name: 'address1', type: 'string', default: '', required: true },
					{ displayName: 'Address Line 2', name: 'address2', type: 'string', default: '' },
					{ displayName: 'City', name: 'city', type: 'string', default: '' },
					{ displayName: 'State/Province', name: 'stateProvince', type: 'string', default: '' },
					{ displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '' },
					{ displayName: 'Country', name: 'country', type: 'string', default: '' },
					{ displayName: 'Phone', name: 'phone', type: 'string', default: '' },
				],
			},
		],
		description: 'Address to add',
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
				resource: ['customer'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Customer email address',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Customer phone number',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: 'USD',
				description: 'Default currency (3-letter code)',
			},
			{
				displayName: 'Pricing Level',
				name: 'pricingLevel',
				type: 'string',
				default: '',
				description: 'Pricing level name or ID',
			},
			{
				displayName: 'Tax Number',
				name: 'taxNumber',
				type: 'string',
				default: '',
				description: 'Tax/VAT number',
			},
			{
				displayName: 'Credit Limit',
				name: 'creditLimit',
				type: 'number',
				typeOptions: {
					numberPrecision: 2,
				},
				default: 0,
				description: 'Customer credit limit',
			},
			{
				displayName: 'Payment Terms',
				name: 'paymentTerms',
				type: 'string',
				default: '',
				description: 'Payment terms (e.g., Net 30)',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Customer notes',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the customer is active',
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
				resource: ['customer'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Customer name',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Customer email address',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Customer phone number',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: '',
				description: 'Default currency',
			},
			{
				displayName: 'Pricing Level',
				name: 'pricingLevel',
				type: 'string',
				default: '',
				description: 'Pricing level name or ID',
			},
			{
				displayName: 'Tax Number',
				name: 'taxNumber',
				type: 'string',
				default: '',
				description: 'Tax/VAT number',
			},
			{
				displayName: 'Credit Limit',
				name: 'creditLimit',
				type: 'number',
				typeOptions: {
					numberPrecision: 2,
				},
				default: 0,
				description: 'Customer credit limit',
			},
			{
				displayName: 'Payment Terms',
				name: 'paymentTerms',
				type: 'string',
				default: '',
				description: 'Payment terms',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Customer notes',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the customer is active',
			},
		],
	},
];

export async function executeCustomerOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'get': {
			const customerId = this.getNodeParameter('customerId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/customers/${customerId}`);
			break;
		}

		case 'getAll': {
			const returnAll = this.getNodeParameter('returnAll', i) as boolean;
			const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
			const query: IDataObject = {};

			if (filters.smart) {
				query['filter[smart]'] = filters.smart;
			}
			if (filters.isActive !== undefined) {
				query['filter[isActive]'] = filters.isActive;
			}

			if (returnAll) {
				responseData = await inFlowApiRequestAllItems.call(this, 'GET', '/customers', {}, query);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(this, 'GET', '/customers', {}, query);
			}
			break;
		}

		case 'create': {
			const name = this.getNodeParameter('name', i) as string;
			const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			const body: IDataObject = { name };

			// Process pricing level
			if (additionalFields.pricingLevel) {
				body.pricingLevel = createReference(additionalFields.pricingLevel as string);
			}

			// Process simple fields
			const simpleFields = [
				'email', 'phone', 'currency', 'taxNumber',
				'creditLimit', 'paymentTerms', 'notes', 'isActive',
			];

			for (const field of simpleFields) {
				if (additionalFields[field] !== undefined) {
					body[field] = additionalFields[field];
				}
			}

			// Process addresses
			if (additionalFields.billingAddress) {
				const billingData = additionalFields.billingAddress as IDataObject;
				if (billingData.address) {
					body.billingAddress = buildAddress(billingData.address as IDataObject);
				}
			}

			if (additionalFields.shippingAddress) {
				const shippingData = additionalFields.shippingAddress as IDataObject;
				if (shippingData.address) {
					body.shippingAddress = buildAddress(shippingData.address as IDataObject);
				}
			}

			responseData = await inFlowApiRequest.call(this, 'POST', '/customers', cleanObject(body));
			break;
		}

		case 'update': {
			const customerId = this.getNodeParameter('customerId', i) as string;
			const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

			const body: IDataObject = {};

			if (updateFields.pricingLevel) {
				body.pricingLevel = createReference(updateFields.pricingLevel as string);
			}

			const simpleFields = [
				'name', 'email', 'phone', 'currency', 'taxNumber',
				'creditLimit', 'paymentTerms', 'notes', 'isActive',
			];

			for (const field of simpleFields) {
				if (updateFields[field] !== undefined) {
					body[field] = updateFields[field];
				}
			}

			responseData = await inFlowApiRequest.call(this, 'PUT', `/customers/${customerId}`, cleanObject(body));
			break;
		}

		case 'delete': {
			const customerId = this.getNodeParameter('customerId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'DELETE', `/customers/${customerId}`);
			responseData = handleEmptyResponse(responseData, 'delete');
			break;
		}

		case 'getOrders': {
			const customerId = this.getNodeParameter('customerId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/customers/${customerId}/orders`);
			break;
		}

		case 'getAddresses': {
			const customerId = this.getNodeParameter('customerId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/customers/${customerId}/addresses`);
			break;
		}

		case 'addAddress': {
			const customerId = this.getNodeParameter('customerId', i) as string;
			const addressData = this.getNodeParameter('address', i, {}) as IDataObject;

			let body: IDataObject = {};
			if (addressData.addressDetails) {
				body = buildAddress(addressData.addressDetails as IDataObject);
			}

			responseData = await inFlowApiRequest.call(this, 'POST', `/customers/${customerId}/addresses`, cleanObject(body));
			break;
		}

		case 'getBalance': {
			const customerId = this.getNodeParameter('customerId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/customers/${customerId}/balance`);
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Customer resource`);
	}

	return responseData;
}
