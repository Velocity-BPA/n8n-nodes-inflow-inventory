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
	handleEmptyResponse,
} from '../../transport';
import { cleanObject } from '../../utils/helpers';

export const categoryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['category'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new category',
				action: 'Create a category',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a category',
				action: 'Delete a category',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a category by ID',
				action: 'Get a category',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all categories',
				action: 'Get all categories',
			},
			{
				name: 'Get Products',
				value: 'getProducts',
				description: 'Get products in a category',
				action: 'Get category products',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a category',
				action: 'Update a category',
			},
		],
		default: 'get',
	},
];

export const categoryFields: INodeProperties[] = [
	// Category ID
	{
		displayName: 'Category ID',
		name: 'categoryId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['category'],
				operation: ['get', 'update', 'delete', 'getProducts'],
			},
		},
		description: 'The unique identifier of the category',
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
				resource: ['category'],
				operation: ['create'],
			},
		},
		description: 'Category name',
	},

	// Return All
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['category'],
				operation: ['getAll', 'getProducts'],
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
				resource: ['category'],
				operation: ['getAll', 'getProducts'],
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
				resource: ['category'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Smart Search',
				name: 'smart',
				type: 'string',
				default: '',
				description: 'Search by category name',
			},
			{
				displayName: 'Active Only',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether to return only active categories',
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
				resource: ['category'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Category description',
			},
			{
				displayName: 'Parent Category ID',
				name: 'parentCategoryId',
				type: 'string',
				default: '',
				description: 'Parent category for hierarchical structure',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the category is active',
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
				resource: ['category'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Category name',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Category description',
			},
			{
				displayName: 'Parent Category ID',
				name: 'parentCategoryId',
				type: 'string',
				default: '',
				description: 'Parent category ID',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the category is active',
			},
		],
	},
];

export async function executeCategoryOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'get': {
			const categoryId = this.getNodeParameter('categoryId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/categories/${categoryId}`);
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
				responseData = await inFlowApiRequestAllItems.call(this, 'GET', '/categories', {}, query);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(this, 'GET', '/categories', {}, query);
			}
			break;
		}

		case 'create': {
			const name = this.getNodeParameter('name', i) as string;
			const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			const body: IDataObject = { name };

			if (additionalFields.description) {
				body.description = additionalFields.description;
			}
			if (additionalFields.parentCategoryId) {
				body.parentCategoryId = additionalFields.parentCategoryId;
			}
			if (additionalFields.isActive !== undefined) {
				body.isActive = additionalFields.isActive;
			}

			responseData = await inFlowApiRequest.call(this, 'POST', '/categories', cleanObject(body));
			break;
		}

		case 'update': {
			const categoryId = this.getNodeParameter('categoryId', i) as string;
			const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

			const body: IDataObject = {};

			const simpleFields = ['name', 'description', 'parentCategoryId', 'isActive'];

			for (const field of simpleFields) {
				if (updateFields[field] !== undefined) {
					body[field] = updateFields[field];
				}
			}

			responseData = await inFlowApiRequest.call(this, 'PUT', `/categories/${categoryId}`, cleanObject(body));
			break;
		}

		case 'delete': {
			const categoryId = this.getNodeParameter('categoryId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'DELETE', `/categories/${categoryId}`);
			responseData = handleEmptyResponse(responseData, 'delete');
			break;
		}

		case 'getProducts': {
			const categoryId = this.getNodeParameter('categoryId', i) as string;
			const returnAll = this.getNodeParameter('returnAll', i) as boolean;
			const query: IDataObject = {};

			if (returnAll) {
				responseData = await inFlowApiRequestAllItems.call(
					this,
					'GET',
					`/categories/${categoryId}/products`,
					{},
					query,
				);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(
					this,
					'GET',
					`/categories/${categoryId}/products`,
					{},
					query,
				);
			}
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Category resource`);
	}

	return responseData;
}
