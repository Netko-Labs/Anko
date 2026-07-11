# MCP access

Anko exposes saved database connections to local MCP clients over authenticated
Streamable HTTP and a bundled stdio bridge. MCP is disabled until it is enabled
in **Settings**.

The HTTP endpoint binds only to `127.0.0.1` and defaults to
`http://127.0.0.1:43821/mcp`. Copy the endpoint and bearer token from Settings.
Rotating the token or changing the port closes every existing MCP session.

For stdio clients, install the bridge from Settings and use the displayed
`anko-mcp` command as the MCP server executable. The bridge reads Anko's local
MCP endpoint configuration and never reads database credentials.

MCP clients can inspect saved connections and database schemas. Opening a saved
connection always requires approval in Anko. A single parsed read-only `SELECT`
can execute automatically inside a database-enforced read-only transaction and
is capped at 200 rows by default. Every other query requires a fresh approval;
there is no remembered trust or session-wide write permission.

The connection list exposed through MCP includes only the saved ID, name,
driver, default database, and active state. Hosts, usernames, passwords, and
encrypted credential values are never returned.
