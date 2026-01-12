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

export const adjustmentReasonOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['adjustmentReason'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new adjustment reason',
				action: 'Create an adjustment reason',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an adjustment reason',
				action: 'Delete an adjustment reason',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an adjustment reason by ID',
				action: 'Get an adjustment reason',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all adjustment reasons',
				action: 'Get all adjustment reasons',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an adjustment reason',
				action: 'Update an adjustment reason',
			},
		],
		default: 'get',
	},
];

export const adjustmentReasonFields: INodeProperties[] = [
	// Adjustment Reason ID
	{
		displayName: 'Adjustment Reason ID',
		name: 'adjustmentReasonId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['adjustmentReason'],
				operation: ['get', 'update', 'delete'],
			},
		},
		description: 'The unique identifier of the adjustment reason',
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
				resource: ['adjustmentReason'],
				operation: ['create'],
			},
		},
		description: 'Adjustment reason name',
	},

	// Reason Type for create
	{
		displayName: 'Reason Type',
		name: 'reasonType',
		type: 'options',
		required: true,
		options: [
			{ name: 'Increase', value: 'Increase' },
			{ name: 'Decrease', value: 'Decrease' },
		],
		default: 'Decrease',
		displayOptions: {
			show: {
				resource: ['adjustmentReason'],
				operation: ['create'],
			},
		},
		description: 'Whether this reason increases or decreases inventory',
	},

	// Return All
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['adjustmentReason'],
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
				resource: ['adjustmentReason'],
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
				resource: ['adjustmentReason'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Smart Search',
				name: 'smart',
				type: 'string',
				default: '',
				description: 'Search by reason name',
			},
			{
				displayName: 'Reason Type',
				name: 'reasonType',
				type: 'options',
				options: [
					{ name: 'Increase', value: 'Increase' },
					{ name: 'Decrease', value: 'Decrease' },
				],
				default: '',
				description: 'Filter by reason type',
			},
			{
				displayName: 'Active Only',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether to return only active reasons',
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
				resource: ['adjustmentReason'],
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
				description: 'Adjustment reason description',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the adjustment reason is active',
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
				resource: ['adjustmentReason'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Adjustment reason name',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Adjustment reason description',
			},
			{
				displayName: 'Reason Type',
				name: 'reasonType',
				type: 'options',
				options: [
					{ name: 'Increase', value: 'Increase' },
					{ name: 'Decrease', value: 'Decrease' },
				],
				default: 'Decrease',
				description: 'Reason type',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the adjustment reason is active',
			},
		],
	},
];

export async function executeAdjustmentReasonOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'get': {
			const adjustmentReasonId = this.getNodeParameter('adjustmentReasonId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/adjustmentReasons/${adjustmentReasonId}`);
			break;
		}

		case 'getAll': {
			const returnAll = this.getNodeParameter('returnAll', i) as boolean;
			const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
			const query: IDataObject = {};

			if (filters.smart) {
				query['filter[smart]'] = filters.smart;
			}
			if (filters.reasonType) {
				query['filter[reasonType]'] = filters.reasonType;
			}
			if (filters.isActive !== undefined) {
				query['filter[isActive]'] = filters.isActive;
			}

			if (returnAll) {
				responseData = await inFlowApiRequestAllItems.call(this, 'GET', '/adjustmentReasons', {}, query);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(this, 'GET', '/adjustmentReasons', {}, query);
			}
			break;
		}

		case 'create': {
			const name = this.getNodeParameter('name', i) as string;
			const reasonType = this.getNodeParameter('reasonType', i) as string;
			const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			const body: IDataObject = {
				name,
				reasonType,
			};

			if (additionalFields.description) {
				body.description = additionalFields.description;
			}
			if (additionalFields.isActive !== undefined) {
				body.isActive = additionalFields.isActive;
			}

			responseData = await inFlowApiRequest.call(this, 'POST', '/adjustmentReasons', cleanObject(body));
			break;
		}

		case 'update': {
			const adjustmentReasonId = this.getNodeParameter('adjustmentReasonId', i) as string;
			const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

			const body: IDataObject = {};

			const simpleFields = ['name', 'description', 'reasonType', 'isActive'];

			for (const field of simpleFields) {
				if (updateFields[field] !== undefined) {
					body[field] = updateFields[field];
				}
			}

			responseData = await inFlowApiRequest.call(this, 'PUT', `/adjustmentReasons/${adjustmentReasonId}`, cleanObject(body));
			break;
		}

		case 'delete': {
			const adjustmentReasonId = this.getNodeParameter('adjustmentReasonId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'DELETE', `/adjustmentReasons/${adjustmentReasonId}`);
			responseData = handleEmptyResponse(responseData, 'delete');
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Adjustment Reason resource`);
	}

	return responseData;
}
