import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c5097d42/health", (c) => {
  return c.json({ status: "ok" });
});

// ============ Project Info Endpoints ============
app.get("/make-server-c5097d42/project-info", async (c) => {
  try {
    const projectInfo = await kv.get("project-info");
    if (!projectInfo) {
      return c.json({
        title: 'E-Commerce Platform Modernization',
        description: 'A comprehensive project to modernize our legacy e-commerce platform, implementing modern architecture patterns, improving user experience, and enhancing system scalability.'
      });
    }
    return c.json(projectInfo);
  } catch (error) {
    console.error('Error fetching project info:', error);
    return c.json({ error: 'Failed to fetch project info' }, 500);
  }
});

app.put("/make-server-c5097d42/project-info", async (c) => {
  try {
    const body = await c.req.json();
    await kv.set("project-info", body);
    return c.json(body);
  } catch (error) {
    console.error('Error updating project info:', error);
    return c.json({ error: 'Failed to update project info' }, 500);
  }
});

// ============ Team Members Endpoints ============
app.get("/make-server-c5097d42/team-members", async (c) => {
  try {
    const members = await kv.getByPrefix("team-member:");
    return c.json(members || []);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return c.json({ error: 'Failed to fetch team members' }, 500);
  }
});

app.post("/make-server-c5097d42/team-members", async (c) => {
  try {
    const body = await c.req.json();
    await kv.set(`team-member:${body.id}`, body);
    return c.json(body);
  } catch (error) {
    console.error('Error creating team member:', error);
    return c.json({ error: 'Failed to create team member' }, 500);
  }
});

app.put("/make-server-c5097d42/team-members/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await kv.set(`team-member:${id}`, body);
    return c.json(body);
  } catch (error) {
    console.error('Error updating team member:', error);
    return c.json({ error: 'Failed to update team member' }, 500);
  }
});

app.delete("/make-server-c5097d42/team-members/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`team-member:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return c.json({ error: 'Failed to delete team member' }, 500);
  }
});

// ============ Documents Endpoints ============
app.get("/make-server-c5097d42/documents", async (c) => {
  try {
    const documents = await kv.getByPrefix("document:");
    return c.json(documents || []);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return c.json({ error: 'Failed to fetch documents' }, 500);
  }
});

app.post("/make-server-c5097d42/documents", async (c) => {
  try {
    const body = await c.req.json();
    await kv.set(`document:${body.id}`, body);
    return c.json(body);
  } catch (error) {
    console.error('Error creating document:', error);
    return c.json({ error: 'Failed to create document' }, 500);
  }
});

app.put("/make-server-c5097d42/documents/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await kv.set(`document:${id}`, body);
    return c.json(body);
  } catch (error) {
    console.error('Error updating document:', error);
    return c.json({ error: 'Failed to update document' }, 500);
  }
});

app.delete("/make-server-c5097d42/documents/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`document:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return c.json({ error: 'Failed to delete document' }, 500);
  }
});

// ============ Ideas Endpoints ============
app.get("/make-server-c5097d42/ideas", async (c) => {
  try {
    const ideas = await kv.getByPrefix("idea:");
    return c.json(ideas || []);
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return c.json({ error: 'Failed to fetch ideas' }, 500);
  }
});

app.post("/make-server-c5097d42/ideas", async (c) => {
  try {
    const body = await c.req.json();
    await kv.set(`idea:${body.id}`, body);
    return c.json(body);
  } catch (error) {
    console.error('Error creating idea:', error);
    return c.json({ error: 'Failed to create idea' }, 500);
  }
});

app.put("/make-server-c5097d42/ideas/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await kv.set(`idea:${id}`, body);
    return c.json(body);
  } catch (error) {
    console.error('Error updating idea:', error);
    return c.json({ error: 'Failed to update idea' }, 500);
  }
});

app.delete("/make-server-c5097d42/ideas/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`idea:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting idea:', error);
    return c.json({ error: 'Failed to delete idea' }, 500);
  }
});

// ============ Requirements Endpoints ============
app.get("/make-server-c5097d42/requirements", async (c) => {
  try {
    const requirements = await kv.getByPrefix("requirement:");
    return c.json(requirements || []);
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return c.json({ error: 'Failed to fetch requirements' }, 500);
  }
});

app.post("/make-server-c5097d42/requirements", async (c) => {
  try {
    const body = await c.req.json();
    await kv.set(`requirement:${body.id}`, body);
    return c.json(body);
  } catch (error) {
    console.error('Error creating requirement:', error);
    return c.json({ error: 'Failed to create requirement' }, 500);
  }
});

app.put("/make-server-c5097d42/requirements/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await kv.set(`requirement:${id}`, body);
    return c.json(body);
  } catch (error) {
    console.error('Error updating requirement:', error);
    return c.json({ error: 'Failed to update requirement' }, 500);
  }
});

app.delete("/make-server-c5097d42/requirements/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`requirement:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting requirement:', error);
    return c.json({ error: 'Failed to delete requirement' }, 500);
  }
});

// ============ Change Requests Endpoints ============
app.get("/make-server-c5097d42/change-requests", async (c) => {
  try {
    const changeRequests = await kv.getByPrefix("change-request:");
    return c.json(changeRequests || []);
  } catch (error) {
    console.error('Error fetching change requests:', error);
    return c.json({ error: 'Failed to fetch change requests' }, 500);
  }
});

app.post("/make-server-c5097d42/change-requests", async (c) => {
  try {
    const body = await c.req.json();
    await kv.set(`change-request:${body.id}`, body);
    return c.json(body);
  } catch (error) {
    console.error('Error creating change request:', error);
    return c.json({ error: 'Failed to create change request' }, 500);
  }
});

app.put("/make-server-c5097d42/change-requests/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await kv.set(`change-request:${id}`, body);
    return c.json(body);
  } catch (error) {
    console.error('Error updating change request:', error);
    return c.json({ error: 'Failed to update change request' }, 500);
  }
});

app.delete("/make-server-c5097d42/change-requests/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`change-request:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting change request:', error);
    return c.json({ error: 'Failed to delete change request' }, 500);
  }
});

// ============ Initialize Data ============
app.post("/make-server-c5097d42/initialize-data", async (c) => {
  try {
    const { entity, data } = await c.req.json();
    
    if (entity === 'team-members') {
      for (const item of data) {
        await kv.set(`team-member:${item.id}`, item);
      }
    } else if (entity === 'documents') {
      for (const item of data) {
        await kv.set(`document:${item.id}`, item);
      }
    } else if (entity === 'ideas') {
      for (const item of data) {
        await kv.set(`idea:${item.id}`, item);
      }
    } else if (entity === 'requirements') {
      for (const item of data) {
        await kv.set(`requirement:${item.id}`, item);
      }
    } else if (entity === 'change-requests') {
      for (const item of data) {
        await kv.set(`change-request:${item.id}`, item);
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error initializing data:', error);
    return c.json({ error: 'Failed to initialize data' }, 500);
  }
});

Deno.serve(app.fetch);