import ssri from 'ssri';
import fs from 'fs';
import { encrypt } from '../lib/crypt.js';

import { CONFIG_KEY } from '../src/shared.js'

/**
 * 
 * @param {import('next').NextApiRequest} request 
 * @param {import('next').NextApiResponse} response 
 */
export default async function handler(
  request,
  response
) {
  const selfURL = `https://${request.headers.host}/`
  const key = Buffer.from(process.env.CIPHER_SECRET, 'hex')
  const wallet = request.query.wallet
  const projectName = request.query.projectName

  safeInputStrings({
    wallet, projectName
  })


  const encryptedConfig = encrypt(JSON.stringify({ wallet }), key);
  const config = {
    projectName
  }

  const integrityHash = await ssri.fromStream(fs.createReadStream('./public/script.js'), {
    algorithms: ['sha384']
  }).toString()
  const integrity = `integrity="${integrityHash}"`;
  // const integrity = ``;

  const scriptSrc = new URL('/script.js', selfURL).href;


  const script = `<script>
window['${CONFIG_KEY}'] = {
  conf: ${JSON.stringify(config, null, 2)}
  id: '${encryptedConfig}',
}
</script>
<script defer crossorigin="anonymous" src="${scriptSrc}" ${integrity}>`

  response.setHeader('content-type', 'text/plain');
  response.send(script);

}

function safeInputStrings(inputs) {
  Object.entries(inputs).map(([k, v]) => {
    if (v.match(/['"<>]/)) {
      throw Error(`Please avoid using '"<> characters in '${k}'`)
    }
  })
}