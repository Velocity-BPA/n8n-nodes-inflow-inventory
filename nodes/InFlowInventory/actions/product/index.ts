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
	buildIncludeParams,
	buildFilterParams,
	handleEmptyResponse,
} from '../../transport';
import { wrapData, cleanObject, createReference } from '../../utils/helpers';

export const productOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['product'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new product',
				action: 'Create a product',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a product',
				action: 'Delete a product',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a product by ID',
				action: 'Get a product',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all products',
				action: 'Get all products',
			},
			{
				name: 'Get Barcode',
				value: 'getBarcode',
				description: 'Get product barcode',
				action: 'Get product barcode',
			},
			{
				name: 'Get Inventory Summary',
				value: 'getInventorySummary',
				description: 'Get inventory across locations',
				action: 'Get inventory summary',
			},
			{
				name: 'Get Pricing',
				value: 'getPricing',
				description: 'Get product pricing',
				action: 'Get product pricing',
			},
			{
				name: 'Get Vendors',
				value: 'getVendors',
				description: 'Get vendor items for product',
				action: 'Get product vendors',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a product',
				action: 'Update a product',
			},
		],
		default: 'get',
	},
];

export const productFields: INodeProperties[] = [
	// Product ID field for operations that need it
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['get', 'update', 'delete', 'getInventorySummary', 'getBarcode', 'getPricing', 'getVendors'],
			},
		},
		description: 'The unique identifier of the product (GUID format)',
	},

	// Product Name for create
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['create'],
			},
		},
		description: 'The name of the product',
	},

	// Return All toggle for getAll
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['getAll'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},

	// Limit for getAll
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
				resource: ['product'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},

	// Filters for getAll
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Smart Search',
				name: 'smart',
				type: 'string',
				default: '',
				description: 'Search across name, SKU, and barcode fields',
			},
			{
				displayName: 'Category',
				name: 'category',
				type: 'string',
				default: '',
				description: 'Filter by category name or ID',
			},
			{
				displayName: 'Item Type',
				name: 'itemType',
				type: 'options',
				options: [
					{ name: 'Stocked Product', value: 'StockedProduct' },
					{ name: 'Non-Stocked Product', value: 'NonstockedProduct' },
					{ name: 'Service', value: 'Service' },
				],
				default: 'StockedProduct',
				description: 'Filter by item type',
			},
			{
				displayName: 'Active Only',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether to return only active products',
			},
		],
	},

	// Include options for get and getAll
	{
		displayName: 'Include',
		name: 'include',
		type: 'multiOptions',
		default: [],
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['get', 'getAll'],
			},
		},
		options: [
			{ name: 'Cost', value: 'cost' },
			{ name: 'Default Price', value: 'defaultPrice' },
			{ name: 'Inventory Lines', value: 'inventoryLines' },
			{ name: 'Vendor Items', value: 'vendorItems' },
		],
		description: 'Include related data in the response',
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
				resource: ['product'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'SKU',
				name: 'sku',
				type: 'string',
				default: '',
				description: 'Stock keeping unit',
			},
			{
				displayName: 'Barcode',
				name: 'barcode',
				type: 'string',
				default: '',
				description: 'Product barcode',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Product description',
			},
			{
				displayName: 'Category',
				name: 'category',
				type: 'string',
				default: '',
				description: 'Product category name or ID',
			},
			{
				displayName: 'Item Type',
				name: 'itemType',
				type: 'options',
				options: [
					{ name: 'Stocked Product', value: 'StockedProduct' },
					{ name: 'Non-Stocked Product', value: 'NonstockedProduct' },
					{ name: 'Service', value: 'Service' },
				],
				default: 'StockedProduct',
				description: 'Type of product',
			},
			{
				displayName: 'Default Price',
				name: 'defaultPrice',
				type: 'number',
				typeOptions: {
					numberPrecision: 2,
				},
				default: 0,
				description: 'Default selling price',
			},
			{
				displayName: 'Cost',
				name: 'cost',
				type: 'number',
				typeOptions: {
					numberPrecision: 2,
				},
				default: 0,
				description: 'Product cost',
			},
			{
				displayName: 'Reorder Point',
				name: 'reorderPoint',
				type: 'number',
				default: 0,
				description: 'Inventory level that triggers reorder',
			},
			{
				displayName: 'Reorder Quantity',
				name: 'reorderQuantity',
				type: 'number',
				default: 0,
				description: 'Quantity to reorder',
			},
			{
				displayName: 'Weight',
				name: 'weight',
				type: 'number',
				typeOptions: {
					numberPrecision: 2,
				},
				default: 0,
				description: 'Product weight',
			},
			{
				displayName: 'Weight Unit',
				name: 'weightUnit',
				type: 'options',
				options: [
					{ name: 'Pounds (lb)', value: 'lb' },
					{ name: 'Kilograms (kg)', value: 'kg' },
					{ name: 'Ounces (oz)', value: 'oz' },
					{ name: 'Grams (g)', value: 'g' },
				],
				default: 'lb',
				description: 'Unit of weight measurement',
			},
			{
				displayName: 'Country of Origin',
				name: 'originCountry',
				type: 'string',
				default: '',
				description: 'Country of origin (2-letter code)',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the product is active',
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
				resource: ['product'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Product name',
			},
			{
				displayName: 'SKU',
				name: 'sku',
				type: 'string',
				default: '',
				description: 'Stock keeping unit',
			},
			{
				displayName: 'Barcode',
				name: 'barcode',
				type: 'string',
				default: '',
				description: 'Product barcode',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Product description',
			},
			{
				displayName: 'Category',
				name: 'category',
				type: 'string',
				default: '',
				description: 'Product category name or ID',
			},
			{
				displayName: 'Item Type',
				name: 'itemType',
				type: 'options',
				options: [
					{ name: 'Stocked Product', value: 'StockedProduct' },
					{ name: 'Non-Stocked Product', value: 'NonstockedProduct' },
					{ name: 'Service', value: 'Service' },
				],
				default: 'StockedProduct',
				description: 'Type of product',
			},
			{
				displayName: 'Default Price',
				name: 'defaultPrice',
				type: 'number',
				typeOptions: {
					numberPrecision: 2,
				},
				default: 0,
				description: 'Default selling price',
			},
			{
				displayName: 'Cost',
				name: 'cost',
				type: 'number',
				typeOptions: {
					numberPrecision: 2,
				},
				default: 0,
				description: 'Product cost',
			},
			{
				displayName: 'Reorder Point',
				name: 'reorderPoint',
				type: 'number',
				default: 0,
				description: 'Inventory level that triggers reorder',
			},
			{
				displayName: 'Reorder Quantity',
				name: 'reorderQuantity',
				type: 'number',
				default: 0,
				description: 'Quantity to reorder',
			},
			{
				displayName: 'Weight',
				name: 'weight',
				type: 'number',
				typeOptions: {
					numberPrecision: 2,
				},
				default: 0,
				description: 'Product weight',
			},
			{
				displayName: 'Weight Unit',
				name: 'weightUnit',
				type: 'options',
				options: [
					{ name: 'Pounds (lb)', value: 'lb' },
					{ name: 'Kilograms (kg)', value: 'kg' },
					{ name: 'Ounces (oz)', value: 'oz' },
					{ name: 'Grams (g)', value: 'g' },
				],
				default: 'lb',
				description: 'Unit of weight measurement',
			},
			{
				displayName: 'Country of Origin',
				name: 'originCountry',
				type: 'string',
				default: '',
				description: 'Country of origin (2-letter code)',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the product is active',
			},
		],
	},
];

export async function executeProductOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'get': {
			const productId = this.getNodeParameter('productId', i) as string;
			const include = this.getNodeParameter('include', i, []) as string[];
			const query: IDataObject = {};

			if (include.length > 0) {
				query.include = buildIncludeParams(include);
			}

			responseData = await inFlowApiRequest.call(this, 'GET', `/products/${productId}`, {}, query);
			break;
		}

		case 'getAll': {
			const returnAll = this.getNodeParameter('returnAll', i) as boolean;
			const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
			const include = this.getNodeParameter('include', i, []) as string[];
			const query: IDataObject = {};

			if (include.length > 0) {
				query.include = buildIncludeParams(include);
			}

			// Apply filters
			const filterParams = buildFilterParams(filters);
			Object.assign(query, filterParams);

			if (returnAll) {
				responseData = await inFlowApiRequestAllItems.call(this, 'GET', '/products', {}, query);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(this, 'GET', '/products', {}, query);
			}
			break;
		}

		case 'create': {
			const name = this.getNodeParameter('name', i) as string;
			const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			const body: IDataObject = { name };

			// Process additional fields
			if (additionalFields.category) {
				body.category = createReference(additionalFields.category as string);
			}

			const simpleFields = [
				'sku', 'barcode', 'description', 'itemType', 'defaultPrice',
				'cost', 'reorderPoint', 'reorderQuantity', 'weight', 'weightUnit',
				'originCountry', 'isActive',
			];

			for (const field of simpleFields) {
				if (additionalFields[field] !== undefined) {
					body[field] = additionalFields[field];
				}
			}

			responseData = await inFlowApiRequest.call(this, 'POST', '/products', cleanObject(body));
			break;
		}

		case 'update': {
			const productId = this.getNodeParameter('productId', i) as string;
			const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

			const body: IDataObject = {};

			if (updateFields.category) {
				body.category = createReference(updateFields.category as string);
			}

			const simpleFields = [
				'name', 'sku', 'barcode', 'description', 'itemType', 'defaultPrice',
				'cost', 'reorderPoint', 'reorderQuantity', 'weight', 'weightUnit',
				'originCountry', 'isActive',
			];

			for (const field of simpleFields) {
				if (updateFields[field] !== undefined) {
					body[field] = updateFields[field];
				}
			}

			responseData = await inFlowApiRequest.call(this, 'PUT', `/products/${productId}`, cleanObject(body));
			break;
		}

		case 'delete': {
			const productId = this.getNodeParameter('productId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'DELETE', `/products/${productId}`);
			responseData = handleEmptyResponse(responseData, 'delete');
			break;
		}

		case 'getInventorySummary': {
			const productId = this.getNodeParameter('productId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/products/${productId}/inventory`);
			break;
		}

		case 'getBarcode': {
			const productId = this.getNodeParameter('productId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/products/${productId}/barcode`);
			break;
		}

		case 'getPricing': {
			const productId = this.getNodeParameter('productId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/products/${productId}/pricing`);
			break;
		}

		case 'getVendors': {
			const productId = this.getNodeParameter('productId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/products/${productId}/vendors`);
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Product resource`);
	}

	return responseData;
}
