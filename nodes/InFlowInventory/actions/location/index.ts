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
import { cleanObject } from '../../utils/helpers';

export const locationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['location'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new location',
				action: 'Create a location',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a location',
				action: 'Delete a location',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a location by ID',
				action: 'Get a location',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all locations',
				action: 'Get all locations',
			},
			{
				name: 'Get Inventory',
				value: 'getInventory',
				description: 'Get inventory at location',
				action: 'Get location inventory',
			},
			{
				name: 'Get Sublocations',
				value: 'getSublocations',
				description: 'Get child locations',
				action: 'Get sublocations',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a location',
				action: 'Update a location',
			},
		],
		default: 'get',
	},
];

export const locationFields: INodeProperties[] = [
	// Location ID
	{
		displayName: 'Location ID',
		name: 'locationId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['location'],
				operation: ['get', 'update', 'delete', 'getInventory', 'getSublocations'],
			},
		},
		description: 'The unique identifier of the location',
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
				resource: ['location'],
				operation: ['create'],
			},
		},
		description: 'Location name',
	},

	// Return All
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['location'],
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
				resource: ['location'],
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
				resource: ['location'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Smart Search',
				name: 'smart',
				type: 'string',
				default: '',
				description: 'Search by location name',
			},
			{
				displayName: 'Active Only',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether to return only active locations',
			},
			{
				displayName: 'Is Pickable',
				name: 'isPickable',
				type: 'boolean',
				default: undefined,
				description: 'Filter by pickable status',
			},
			{
				displayName: 'Is Receivable',
				name: 'isReceivable',
				type: 'boolean',
				default: undefined,
				description: 'Filter by receivable status',
			},
			{
				displayName: 'Is Sellable',
				name: 'isSellable',
				type: 'boolean',
				default: undefined,
				description: 'Filter by sellable status',
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
				resource: ['location'],
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
				description: 'Location description',
			},
			{
				displayName: 'Parent Location ID',
				name: 'parentLocationId',
				type: 'string',
				default: '',
				description: 'Parent location for hierarchical structure',
			},
			{
				displayName: 'Is Pickable',
				name: 'isPickable',
				type: 'boolean',
				default: true,
				description: 'Whether items can be picked from this location',
			},
			{
				displayName: 'Is Receivable',
				name: 'isReceivable',
				type: 'boolean',
				default: true,
				description: 'Whether items can be received into this location',
			},
			{
				displayName: 'Is Sellable',
				name: 'isSellable',
				type: 'boolean',
				default: true,
				description: 'Whether inventory at this location is available for sale',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the location is active',
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
				resource: ['location'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Location name',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Location description',
			},
			{
				displayName: 'Parent Location ID',
				name: 'parentLocationId',
				type: 'string',
				default: '',
				description: 'Parent location ID',
			},
			{
				displayName: 'Is Pickable',
				name: 'isPickable',
				type: 'boolean',
				default: true,
				description: 'Whether items can be picked from this location',
			},
			{
				displayName: 'Is Receivable',
				name: 'isReceivable',
				type: 'boolean',
				default: true,
				description: 'Whether items can be received into this location',
			},
			{
				displayName: 'Is Sellable',
				name: 'isSellable',
				type: 'boolean',
				default: true,
				description: 'Whether inventory is available for sale',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				default: true,
				description: 'Whether the location is active',
			},
		],
	},
];

export async function executeLocationOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'get': {
			const locationId = this.getNodeParameter('locationId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/locations/${locationId}`);
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
			if (filters.isPickable !== undefined) {
				query['filter[isPickable]'] = filters.isPickable;
			}
			if (filters.isReceivable !== undefined) {
				query['filter[isReceivable]'] = filters.isReceivable;
			}
			if (filters.isSellable !== undefined) {
				query['filter[isSellable]'] = filters.isSellable;
			}

			if (returnAll) {
				responseData = await inFlowApiRequestAllItems.call(this, 'GET', '/locations', {}, query);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(this, 'GET', '/locations', {}, query);
			}
			break;
		}

		case 'create': {
			const name = this.getNodeParameter('name', i) as string;
			const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			const body: IDataObject = { name };

			// Process simple fields
			const simpleFields = [
				'description', 'parentLocationId', 'isPickable',
				'isReceivable', 'isSellable', 'isActive',
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

			responseData = await inFlowApiRequest.call(this, 'POST', '/locations', cleanObject(body));
			break;
		}

		case 'update': {
			const locationId = this.getNodeParameter('locationId', i) as string;
			const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

			const body: IDataObject = {};

			const simpleFields = [
				'name', 'description', 'parentLocationId',
				'isPickable', 'isReceivable', 'isSellable', 'isActive',
			];

			for (const field of simpleFields) {
				if (updateFields[field] !== undefined) {
					body[field] = updateFields[field];
				}
			}

			responseData = await inFlowApiRequest.call(this, 'PUT', `/locations/${locationId}`, cleanObject(body));
			break;
		}

		case 'delete': {
			const locationId = this.getNodeParameter('locationId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'DELETE', `/locations/${locationId}`);
			responseData = handleEmptyResponse(responseData, 'delete');
			break;
		}

		case 'getInventory': {
			const locationId = this.getNodeParameter('locationId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/locations/${locationId}/inventory`);
			break;
		}

		case 'getSublocations': {
			const locationId = this.getNodeParameter('locationId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/locations/${locationId}/sublocations`);
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Location resource`);
	}

	return responseData;
}
