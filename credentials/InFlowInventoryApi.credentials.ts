/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class InFlowInventoryApi implements ICredentialType {
	name = 'inFlowInventoryApi';
	displayName = 'inFlow Inventory API';
	documentationUrl = 'https://developer.inflowinventory.com/';
	properties: INodeProperties[] = [
		{
			displayName: 'Company ID',
			name: 'companyId',
			type: 'string',
			default: '',
			required: true,
			placeholder: '550e8400-e29b-41d4-a716-446655440000',
			description: 'Your inFlow Company ID (GUID format) found in Settings → Integrations → API Keys',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your API key from inFlow Settings → Integrations → API Keys',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '=https://cloudapi.inflowinventory.com/{{$credentials.companyId}}',
			url: '/products',
			qs: {
				count: 1,
			},
		},
	};
}
