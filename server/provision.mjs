import {createAccount,createSchool,loadSchool} from './store.mjs';
let input='';for await(const part of process.stdin)input+=part;
const data=JSON.parse(input);const password=process.env.PIES_INITIAL_PASSWORD;
if(!password)throw new Error('Defina PIES_INITIAL_PASSWORD no ambiente.');
if(data.school){loadSchool(data.school);console.log(createAccount(data.school,{...data,password}));}
else console.log(createSchool({...data,password}));
