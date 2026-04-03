// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

import { creerClient } from './client.js';
import { OUTILS_DOCUMENTS, handleDocuments } from './tools/documents.js';
import { OUTILS_CLIENTS, handleClients } from './tools/clients.js';
import { OUTILS_PRODUITS, handleProduits } from './tools/produits.js';
import { OUTILS_PAIEMENTS, handlePaiements } from './tools/paiements.js';
import { OUTILS_DEPARTEMENTS, handleDepartements } from './tools/departements.js';
import { OUTILS_RECURRENCES, handleRecurrences } from './tools/recurrences.js';
import { OUTILS_STOCK, handleStock } from './tools/stock.js';

const TOUS_LES_OUTILS = [
  ...OUTILS_DOCUMENTS,
  ...OUTILS_CLIENTS,
  ...OUTILS_PRODUITS,
  ...OUTILS_PAIEMENTS,
  ...OUTILS_DEPARTEMENTS,
  ...OUTILS_RECURRENCES,
  ...OUTILS_STOCK,
];

async function main() {
  const client = creerClient();

  const server = new Server(
    { name: 'vosfactures-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOUS_LES_OUTILS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args = {} } = request.params;
    const a = args as Record<string, unknown>;

    if (OUTILS_DOCUMENTS.some(t => t.name === name)) return handleDocuments(name, a, client) as unknown as CallToolResult;
    if (OUTILS_CLIENTS.some(t => t.name === name)) return handleClients(name, a, client) as unknown as CallToolResult;
    if (OUTILS_PRODUITS.some(t => t.name === name)) return handleProduits(name, a, client) as unknown as CallToolResult;
    if (OUTILS_PAIEMENTS.some(t => t.name === name)) return handlePaiements(name, a, client) as unknown as CallToolResult;
    if (OUTILS_DEPARTEMENTS.some(t => t.name === name)) return handleDepartements(name, a, client) as unknown as CallToolResult;
    if (OUTILS_RECURRENCES.some(t => t.name === name)) return handleRecurrences(name, a, client) as unknown as CallToolResult;
    if (OUTILS_STOCK.some(t => t.name === name)) return handleStock(name, a, client) as unknown as CallToolResult;

    return {
      content: [{ type: 'text', text: `Erreur : outil inconnu "${name}"` }],
      isError: true,
    } as unknown as CallToolResult;
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
