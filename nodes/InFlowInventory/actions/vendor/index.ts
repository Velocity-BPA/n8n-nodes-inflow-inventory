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

export const vendorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['vendor'],
			},
		},
		options: [
			{
				name: 'Add Product',
				value: 'addProduct',
				description: 'Add a product to vendor',
				action: 'Add product to vendor',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new vendor',
				action: 'Create a vendor',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a vendor',
				action: 'Delete a vendor',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a vendor by ID',
				action: 'Get a vendor',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all vendors',
				action: 'Get all vendors',
			},
			{
				name: 'Get Products',
				value: 'getProducts',
				description: "Get vendor's products",
				action: 'Get vendor products',
			},
			{
				name: 'Get Purchase Orders',
				value: 'getPurchaseOrders',
				description: "Get vendor's purchase orders",
				action: 'Get vendor POs',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a vendor',
				action: 'Update a vendor',
			},
		],
		default: 'get',
	},
];

export const vendorFields: INodeProperties[] = [
	// Vendor ID
	{
		displayName: 'Vendor ID',
		name: 'vendorId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['get', 'update', 'delete', 'getPurchaseOrders', 'getProducts', 'addProduct'],
			},
		},
		description: 'The unique identifier of the vendor',
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
				resource: ['vendor'],
				operation: ['create'],
			},
		},
		description: 'Vendor name',
	},

	// Return All
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['vendor'],
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
				resource: ['vendor'],
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
				resource: ['vendor'],
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
				description: 'Whether to return only active vendors',
			},
		],
	},

	// Product fields for addProduct
	{
		displayName: 'Product',
		name: 'product',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['addProduct'],
			},
		},
		description: 'Product name or ID to add',
	},
	{
		displayName: 'Product Options',
		name: 'productOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['vendor'],
				operation: ['addProduct'],
			},
		},
		options: [
			{
				displayName: 'Vendor SKU',
				name: 'vendorSku',
				type: 'string',
				default: '',
				description: "Vendor's SKU for this product",
			},
			{
				displayName: 'Cost',
				name: 'cost',
				type: 'number',
				typeOptions: {
					numberPrecision: 2,
				},
				default: 0,
				description: 'Cost from this vendor',
			},
			{
				displayName: 'Is Default',
				name: 'isDefault',
				type: 'boolean',
				default: false,
				description: 'Whether this is the default vendor for the product',
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
				resource: ['vendor'],
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
				description: 'Vendor email address',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Vendor phone number',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: 'USD',
				description: 'Default currency (3-letter code)',
			},
			{
				displayName: 'Payment Terms',
				name: 'paymentTerms',
				type: 'string',
				default: '',
				description: 'Payment terms (e.g., Net 30)',
			},
			{
				displayName: 'Account Number',
				name: 'accountNumber',
				type: 'string',
				default: '',
				description: 'Vendor account number',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Vendor notes',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the vendor is active',
			},
			{
				displayName: 'Address',
				name: 'address',
				type: 'fixedCollection',
				default: {},
				options: [
					{
						name: 'addressDetails',
						displayName: 'Address Details',
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
				resource: ['vendor'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Vendor name',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Vendor email address',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Vendor phone number',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: '',
				description: 'Default currency',
			},
			{
				displayName: 'Payment Terms',
				name: 'paymentTerms',
				type: 'string',
				default: '',
				description: 'Payment terms',
			},
			{
				displayName: 'Account Number',
				name: 'accountNumber',
				type: 'string',
				default: '',
				description: 'Vendor account number',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Vendor notes',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the vendor is active',
			},
		],
	},
];

export async function executeVendorOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'get': {
			const vendorId = this.getNodeParameter('vendorId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/vendors/${vendorId}`);
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
				responseData = await inFlowApiRequestAllItems.call(this, 'GET', '/vendors', {}, query);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(this, 'GET', '/vendors', {}, query);
			}
			break;
		}

		case 'create': {
			const name = this.getNodeParameter('name', i) as string;
			const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			const body: IDataObject = { name };

			// Process simple fields
			const simpleFields = [
				'email', 'phone', 'currency', 'paymentTerms',
				'accountNumber', 'notes', 'isActive',
			];

			for (const field of simpleFields) {
				if (additionalFields[field] !== undefined) {
					body[field] = additionalFields[field];
				}
			}

			// Process address
			if (additionalFields.address) {
				const addressData = additionalFields.address as IDataObject;
				if (addressData.addressDetails) {
					body.address = buildAddress(addressData.addressDetails as IDataObject);
				}
			}

			responseData = await inFlowApiRequest.call(this, 'POST', '/vendors', cleanObject(body));
			break;
		}

		case 'update': {
			const vendorId = this.getNodeParameter('vendorId', i) as string;
			const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

			const body: IDataObject = {};

			const simpleFields = [
				'name', 'email', 'phone', 'currency', 'paymentTerms',
				'accountNumber', 'notes', 'isActive',
			];

			for (const field of simpleFields) {
				if (updateFields[field] !== undefined) {
					body[field] = updateFields[field];
				}
			}

			responseData = await inFlowApiRequest.call(this, 'PUT', `/vendors/${vendorId}`, cleanObject(body));
			break;
		}

		case 'delete': {
			const vendorId = this.getNodeParameter('vendorId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'DELETE', `/vendors/${vendorId}`);
			responseData = handleEmptyResponse(responseData, 'delete');
			break;
		}

		case 'getPurchaseOrders': {
			const vendorId = this.getNodeParameter('vendorId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/vendors/${vendorId}/purchaseorders`);
			break;
		}

		case 'getProducts': {
			const vendorId = this.getNodeParameter('vendorId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/vendors/${vendorId}/products`);
			break;
		}

		case 'addProduct': {
			const vendorId = this.getNodeParameter('vendorId', i) as string;
			const product = this.getNodeParameter('product', i) as string;
			const productOptions = this.getNodeParameter('productOptions', i, {}) as IDataObject;

			const body: IDataObject = {
				product: createReference(product),
			};

			if (productOptions.vendorSku) {
				body.vendorSku = productOptions.vendorSku;
			}
			if (productOptions.cost !== undefined) {
				body.cost = productOptions.cost;
			}
			if (productOptions.isDefault !== undefined) {
				body.isDefault = productOptions.isDefault;
			}

			responseData = await inFlowApiRequest.call(this, 'POST', `/vendors/${vendorId}/products`, cleanObject(body));
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Vendor resource`);
	}

	return responseData;
}
