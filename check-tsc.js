try { console.log('typescript', require('typescript').version); } catch(e) { console.log('typescript MISSING'); }
try { console.log('tsc path:', require.resolve('typescript/lib/tsc')); } catch(e) { console.log('tsc MISSING'); }
