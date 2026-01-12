/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
	INodeExecutionData,
} from 'n8n-workflow';

import { inFlowApiRequest } from './transport';

// Helper functions for polling (outside class for proper context handling)
async function initializePollingState(
	context: IPollFunctions,
	event: string,
): Promise<void> {
	const webhookData = context.getWorkflowStaticData('node');
	const endpoint = getEndpointForEvent(event);

	if (endpoint) {
		try {
			const items = await inFlowApiRequest.call(
				context,
				'GET',
				endpoint,
				{},
				{ count: 50 },
			);

			if (Array.isArray(items)) {
				webhookData.knownIds = items.map((item: IDataObject) => item.entityId);
			}
		} catch {
			webhookData.knownIds = [];
		}
	}
}

function getEndpointForEvent(event: string): string | null {
	const endpoints: Record<string, string> = {
		'product.created': '/products',
		'product.updated': '/products',
		'salesOrder.created': '/salesOrders',
		'salesOrder.updated': '/salesOrders',
		'salesOrder.fulfilled': '/salesOrders',
		'purchaseOrder.created': '/purchaseOrders',
		'purchaseOrder.received': '/purchaseOrders',
		'stockAdjustment.created': '/stockAdjustments',
		'stockTransfer.completed': '/stockTransfers',
	};
	return endpoints[event] || null;
}

async function pollProducts(
	context: IPollFunctions,
	actionType: string,
	lastPollTime: string,
	webhookData: IDataObject,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const knownIds = (webhookData.knownIds as string[]) || [];

	const products = await inFlowApiRequest.call(
		context,
		'GET',
		'/products',
		{},
		{ count: 50 },
	);

	if (!Array.isArray(products)) {
		return returnData;
	}

	const currentIds = products.map((p: IDataObject) => p.entityId as string);

	if (actionType === 'created') {
		const newProducts = products.filter(
			(p: IDataObject) => !knownIds.includes(p.entityId as string),
		);
		for (const product of newProducts) {
			returnData.push({
				json: {
					event: 'product.created',
					data: product,
				},
			});
		}
	} else if (actionType === 'updated') {
		for (const product of products) {
			const updatedAt = product.updatedAt as string | undefined;
			if (updatedAt && new Date(updatedAt) > new Date(lastPollTime)) {
				if (knownIds.includes(product.entityId as string)) {
					returnData.push({
						json: {
							event: 'product.updated',
							data: product,
						},
					});
				}
			}
		}
	}

	webhookData.knownIds = currentIds;
	return returnData;
}

async function pollSalesOrders(
	context: IPollFunctions,
	actionType: string,
	lastPollTime: string,
	webhookData: IDataObject,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const knownIds = (webhookData.salesOrderIds as string[]) || [];
	const knownStatuses = (webhookData.salesOrderStatuses as Record<string, string>) || {};

	const orders = await inFlowApiRequest.call(
		context,
		'GET',
		'/salesOrders',
		{},
		{ count: 50 },
	);

	if (!Array.isArray(orders)) {
		return returnData;
	}

	const currentIds = orders.map((o: IDataObject) => o.entityId as string);
	const currentStatuses: Record<string, string> = {};

	for (const order of orders) {
		const entityId = order.entityId as string;
		const status = order.status as string;
		currentStatuses[entityId] = status;

		if (actionType === 'created') {
			if (!knownIds.includes(entityId)) {
				returnData.push({
					json: {
						event: 'salesOrder.created',
						data: order,
					},
				});
			}
		} else if (actionType === 'updated') {
			if (knownIds.includes(entityId)) {
				const updatedAt = order.updatedAt as string | undefined;
				if (updatedAt && new Date(updatedAt) > new Date(lastPollTime)) {
					returnData.push({
						json: {
							event: 'salesOrder.updated',
							data: order,
						},
					});
				}
			}
		} else if (actionType === 'fulfilled') {
			if (
				status === 'Fulfilled' &&
				knownStatuses[entityId] &&
				knownStatuses[entityId] !== 'Fulfilled'
			) {
				returnData.push({
					json: {
						event: 'salesOrder.fulfilled',
						data: order,
					},
				});
			}
		}
	}

	webhookData.salesOrderIds = currentIds;
	webhookData.salesOrderStatuses = currentStatuses;
	return returnData;
}

async function pollPurchaseOrders(
	context: IPollFunctions,
	actionType: string,
	lastPollTime: string,
	webhookData: IDataObject,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const knownIds = (webhookData.purchaseOrderIds as string[]) || [];
	const knownStatuses = (webhookData.purchaseOrderStatuses as Record<string, string>) || {};

	const orders = await inFlowApiRequest.call(
		context,
		'GET',
		'/purchaseOrders',
		{},
		{ count: 50 },
	);

	if (!Array.isArray(orders)) {
		return returnData;
	}

	const currentIds = orders.map((o: IDataObject) => o.entityId as string);
	const currentStatuses: Record<string, string> = {};

	for (const order of orders) {
		const entityId = order.entityId as string;
		const status = order.status as string;
		currentStatuses[entityId] = status;

		if (actionType === 'created') {
			if (!knownIds.includes(entityId)) {
				returnData.push({
					json: {
						event: 'purchaseOrder.created',
						data: order,
					},
				});
			}
		} else if (actionType === 'received') {
			if (
				(status === 'Received' || status === 'PartiallyReceived') &&
				knownStatuses[entityId] === 'Open'
			) {
				returnData.push({
					json: {
						event: 'purchaseOrder.received',
						data: order,
					},
				});
			}
		}
	}

	webhookData.purchaseOrderIds = currentIds;
	webhookData.purchaseOrderStatuses = currentStatuses;
	return returnData;
}

async function pollStockAdjustments(
	context: IPollFunctions,
	webhookData: IDataObject,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const knownIds = (webhookData.stockAdjustmentIds as string[]) || [];

	const adjustments = await inFlowApiRequest.call(
		context,
		'GET',
		'/stockAdjustments',
		{},
		{ count: 50 },
	);

	if (!Array.isArray(adjustments)) {
		return returnData;
	}

	const currentIds = adjustments.map((a: IDataObject) => a.entityId as string);

	const newAdjustments = adjustments.filter(
		(a: IDataObject) => !knownIds.includes(a.entityId as string),
	);

	for (const adjustment of newAdjustments) {
		returnData.push({
			json: {
				event: 'stockAdjustment.created',
				data: adjustment,
			},
		});
	}

	webhookData.stockAdjustmentIds = currentIds;
	return returnData;
}

async function pollStockTransfers(
	context: IPollFunctions,
	actionType: string,
	webhookData: IDataObject,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const knownStatuses = (webhookData.stockTransferStatuses as Record<string, string>) || {};

	const transfers = await inFlowApiRequest.call(
		context,
		'GET',
		'/stockTransfers',
		{},
		{ count: 50 },
	);

	if (!Array.isArray(transfers)) {
		return returnData;
	}

	const currentStatuses: Record<string, string> = {};

	for (const transfer of transfers) {
		const entityId = transfer.entityId as string;
		const status = transfer.status as string;
		currentStatuses[entityId] = status;

		if (actionType === 'completed') {
			if (status === 'Completed' && knownStatuses[entityId] === 'Open') {
				returnData.push({
					json: {
						event: 'stockTransfer.completed',
						data: transfer,
					},
				});
			}
		}
	}

	webhookData.stockTransferStatuses = currentStatuses;
	return returnData;
}

async function pollInventoryChanges(
	context: IPollFunctions,
	options: IDataObject,
	webhookData: IDataObject,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const knownInventory = (webhookData.inventorySnapshot as Record<string, number>) || {};

	const query: IDataObject = {};
	if (options.locationId) {
		query.locationId = options.locationId;
	}

	const inventory = await inFlowApiRequest.call(
		context,
		'GET',
		'/reports/inventorySummary',
		{},
		query,
	);

	if (!Array.isArray(inventory)) {
		return returnData;
	}

	const currentInventory: Record<string, number> = {};

	for (const item of inventory) {
		const productId = item.productId as string;
		const quantityOnHand = item.quantityOnHand as number;
		currentInventory[productId] = quantityOnHand;

		if (
			knownInventory[productId] !== undefined &&
			knownInventory[productId] !== quantityOnHand
		) {
			returnData.push({
				json: {
					event: 'inventory.changed',
					data: {
						product: item.product,
						productId,
						previousQuantity: knownInventory[productId],
						currentQuantity: quantityOnHand,
						change: quantityOnHand - knownInventory[productId],
					},
				},
			});
		}
	}

	webhookData.inventorySnapshot = currentInventory;
	return returnData;
}

async function detectChanges(
	context: IPollFunctions,
	event: string,
	options: IDataObject,
	lastPollTime: string,
	webhookData: IDataObject,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const [resourceType, actionType] = event.split('.');

	try {
		switch (resourceType) {
			case 'product': {
				const items = await pollProducts(context, actionType, lastPollTime, webhookData);
				returnData.push(...items);
				break;
			}
			case 'salesOrder': {
				const items = await pollSalesOrders(context, actionType, lastPollTime, webhookData);
				returnData.push(...items);
				break;
			}
			case 'purchaseOrder': {
				const items = await pollPurchaseOrders(context, actionType, lastPollTime, webhookData);
				returnData.push(...items);
				break;
			}
			case 'stockAdjustment': {
				const items = await pollStockAdjustments(context, webhookData);
				returnData.push(...items);
				break;
			}
			case 'stockTransfer': {
				const items = await pollStockTransfers(context, actionType, webhookData);
				returnData.push(...items);
				break;
			}
			case 'inventory': {
				const items = await pollInventoryChanges(context, options, webhookData);
				returnData.push(...items);
				break;
			}
		}
	} catch (error) {
		// Log but don't fail - polling should continue
		console.error(`Error polling for ${event} events:`, error);
	}

	return returnData;
}

export class InFlowInventoryTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'inFlow Inventory Trigger',
		name: 'inFlowInventoryTrigger',
		icon: 'file:inflow.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Triggers when specified events occur in inFlow Inventory',
		defaults: {
			name: 'inFlow Inventory Trigger',
		},
		polling: true,
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'inFlowInventoryApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'Inventory Changed',
						value: 'inventory.changed',
						description: 'Triggers when inventory levels change',
					},
					{
						name: 'Product Created',
						value: 'product.created',
						description: 'Triggers when a new product is created',
					},
					{
						name: 'Product Updated',
						value: 'product.updated',
						description: 'Triggers when a product is updated',
					},
					{
						name: 'Purchase Order Created',
						value: 'purchaseOrder.created',
						description: 'Triggers when a new purchase order is created',
					},
					{
						name: 'Purchase Order Received',
						value: 'purchaseOrder.received',
						description: 'Triggers when a purchase order is received',
					},
					{
						name: 'Sales Order Created',
						value: 'salesOrder.created',
						description: 'Triggers when a new sales order is created',
					},
					{
						name: 'Sales Order Fulfilled',
						value: 'salesOrder.fulfilled',
						description: 'Triggers when a sales order is fulfilled',
					},
					{
						name: 'Sales Order Updated',
						value: 'salesOrder.updated',
						description: 'Triggers when a sales order is updated',
					},
					{
						name: 'Stock Adjustment Created',
						value: 'stockAdjustment.created',
						description: 'Triggers when a stock adjustment is made',
					},
					{
						name: 'Stock Transfer Completed',
						value: 'stockTransfer.completed',
						description: 'Triggers when a stock transfer is completed',
					},
				],
				default: 'salesOrder.created',
				required: true,
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Location Filter',
						name: 'locationId',
						type: 'string',
						default: '',
						description: 'Only trigger for changes at this location (ID or name)',
					},
					{
						displayName: 'Category Filter',
						name: 'categoryId',
						type: 'string',
						default: '',
						description: 'Only trigger for products in this category (ID or name)',
					},
				],
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const event = this.getNodeParameter('event') as string;
		const options = this.getNodeParameter('options', {}) as IDataObject;

		const webhookData = this.getWorkflowStaticData('node');
		const now = new Date();

		// Get last poll time
		const lastPollTime = webhookData.lastPollTime as string | undefined;

		// Update last poll time
		webhookData.lastPollTime = now.toISOString();

		// If this is the first poll, just save the current state
		if (!lastPollTime) {
			await initializePollingState(this, event);
			return null;
		}

		// Detect changes based on event type
		const changes = await detectChanges(this, event, options, lastPollTime, webhookData);

		if (changes.length === 0) {
			return null;
		}

		return [changes];
	}
}
