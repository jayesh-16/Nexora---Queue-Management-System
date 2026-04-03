const { createClient } = require("@supabase/supabase-js");
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.resolve(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#]+?)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function seed() {
  console.log("Generating mock data for Nexora Analytics...");

  // Generate 7 sessions over the last 30 days
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  const sessions = [];
  
  // Create sessions for Today, This Week (e.g. 3 days ago, 5 days ago), This Month (15 days ago, 25 days ago)
  const offsets = [0, 2, 5, 12, 18, 24, 28];
  
  for (let offset of offsets) {
    const startedAt = new Date(now - (offset * dayMs) - (Math.random() * 4 * 60 * 60 * 1000));
    const isToday = offset === 0;
    const endedAt = isToday ? null : new Date(startedAt.getTime() + (Math.random() * 5 + 2) * 60 * 60 * 1000);
    
    // Insert session
    const { data: session, error } = await supabase.from('sessions').insert({
      name: `Counter A (Mock - Day ${offset})`,
      category: 'Hospital',
      started_at: startedAt.toISOString(),
      ended_at: endedAt ? endedAt.toISOString() : null,
      is_active: isToday,
      token_counter: 0,
      env: "production"
    }).select().single();

    if (error) {
      console.error("Error creating session:", error);
      continue;
    }
    
    sessions.push({ session, offset });
  }

  // Create tokens for each session
  for (let { session, offset } of sessions) {
    let tokenCount = Math.floor(Math.random() * 30) + 10;
    if (offset === 0) tokenCount = 15; // Today has 15 tokens
    
    let tokenCounter = 0;
    const tokensToInsert = [];
    
    const sessionStart = new Date(session.started_at).getTime();
    
    for (let i = 1; i <= tokenCount; i++) {
        tokenCounter++;
        // Distribute token issuances over the session time
        const issueTime = new Date(sessionStart + (i * Math.random() * 10 * 60 * 1000));
        
        let status = "served";
        let calledAt = null;
        let servedAt = null;
        
        if (offset === 0 && i > 10) {
            // Leave a few waiting/called for today
            if (i === 11) {
                status = "called";
                calledAt = new Date(issueTime.getTime() + 50000);
            } else if (i === 15) {
                status = "dropped";
            } else {
                status = "waiting";
            }
        } else {
            // Randomly drop 10%
            if (Math.random() < 0.1) {
                status = "dropped";
            } else {
                status = "served";
                // Wait time between 2 to 15 mins
                const waitTime = Math.floor(Math.random() * 13 * 60000) + 120000;
                calledAt = new Date(issueTime.getTime() + waitTime);
                // Served after 1-3 mins
                servedAt = new Date(calledAt.getTime() + (Math.random() * 2 + 1) * 60000);
            }
        }
        
        tokensToInsert.push({
            session_id: session.id,
            token_number: tokenCounter,
            status,
            issued_at: issueTime.toISOString(),
            called_at: calledAt ? calledAt.toISOString() : null,
            served_at: servedAt ? servedAt.toISOString() : null
        });
    }

    if (tokensToInsert.length > 0) {
        const { error: tokensError } = await supabase.from('queue_tokens').insert(tokensToInsert);
        if (tokensError) {
             console.error("Error inserting tokens:", tokensError);
        } else {
             // Update token counter on session
             await supabase.from('sessions').update({ token_counter: tokenCounter }).eq('id', session.id);
        }
    }
  }

  console.log("Mock data successfully seeded! Reload your analytics dashboard to see 'This Week' and 'This Month'.");
}

seed().catch(console.error);
