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

export const pricingLevelOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['pricingLevel'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new pricing level',
				action: 'Create a pricing level',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a pricing level',
				action: 'Delete a pricing level',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a pricing level by ID',
				action: 'Get a pricing level',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all pricing levels',
				action: 'Get all pricing levels',
			},
			{
				name: 'Get Prices',
				value: 'getPrices',
				description: 'Get all prices for this level',
				action: 'Get prices for level',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a pricing level',
				action: 'Update a pricing level',
			},
		],
		default: 'get',
	},
];

export const pricingLevelFields: INodeProperties[] = [
	// Pricing Level ID
	{
		displayName: 'Pricing Level ID',
		name: 'pricingLevelId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['pricingLevel'],
				operation: ['get', 'update', 'delete', 'getPrices'],
			},
		},
		description: 'The unique identifier of the pricing level',
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
				resource: ['pricingLevel'],
				operation: ['create'],
			},
		},
		description: 'Pricing level name',
	},

	// Return All
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['pricingLevel'],
				operation: ['getAll', 'getPrices'],
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
				resource: ['pricingLevel'],
				operation: ['getAll', 'getPrices'],
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
				resource: ['pricingLevel'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Smart Search',
				name: 'smart',
				type: 'string',
				default: '',
				description: 'Search by pricing level name',
			},
			{
				displayName: 'Active Only',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether to return only active pricing levels',
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
				resource: ['pricingLevel'],
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
				description: 'Pricing level description',
			},
			{
				displayName: 'Is Default',
				name: 'isDefault',
				type: 'boolean',
				default: false,
				description: 'Whether this is the default pricing level',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the pricing level is active',
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
				resource: ['pricingLevel'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Pricing level name',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Pricing level description',
			},
			{
				displayName: 'Is Default',
				name: 'isDefault',
				type: 'boolean',
				default: false,
				description: 'Whether this is the default pricing level',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the pricing level is active',
			},
		],
	},
];

export async function executePricingLevelOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'get': {
			const pricingLevelId = this.getNodeParameter('pricingLevelId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/pricingLevels/${pricingLevelId}`);
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
				responseData = await inFlowApiRequestAllItems.call(this, 'GET', '/pricingLevels', {}, query);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(this, 'GET', '/pricingLevels', {}, query);
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
			if (additionalFields.isDefault !== undefined) {
				body.isDefault = additionalFields.isDefault;
			}
			if (additionalFields.isActive !== undefined) {
				body.isActive = additionalFields.isActive;
			}

			responseData = await inFlowApiRequest.call(this, 'POST', '/pricingLevels', cleanObject(body));
			break;
		}

		case 'update': {
			const pricingLevelId = this.getNodeParameter('pricingLevelId', i) as string;
			const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

			const body: IDataObject = {};

			const simpleFields = ['name', 'description', 'isDefault', 'isActive'];

			for (const field of simpleFields) {
				if (updateFields[field] !== undefined) {
					body[field] = updateFields[field];
				}
			}

			responseData = await inFlowApiRequest.call(this, 'PUT', `/pricingLevels/${pricingLevelId}`, cleanObject(body));
			break;
		}

		case 'delete': {
			const pricingLevelId = this.getNodeParameter('pricingLevelId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'DELETE', `/pricingLevels/${pricingLevelId}`);
			responseData = handleEmptyResponse(responseData, 'delete');
			break;
		}

		case 'getPrices': {
			const pricingLevelId = this.getNodeParameter('pricingLevelId', i) as string;
			const returnAll = this.getNodeParameter('returnAll', i) as boolean;
			const query: IDataObject = {};

			if (returnAll) {
				responseData = await inFlowApiRequestAllItems.call(
					this,
					'GET',
					`/pricingLevels/${pricingLevelId}/prices`,
					{},
					query,
				);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(
					this,
					'GET',
					`/pricingLevels/${pricingLevelId}/prices`,
					{},
					query,
				);
			}
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Pricing Level resource`);
	}

	return responseData;
}
