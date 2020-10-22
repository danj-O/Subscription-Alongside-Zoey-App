// https://www.npmjs.com/package/magento-api-rest
//gets products but 'Request does not match any route.' for customers
//3 MONTHS old

const Magento = require('magento-api-rest').default

const client = new Magento({
    'url': 'http://2ieb7j62xark0rjf.mojostratus.io',
    'consumerKey': '4w1pbkgvtkqzadm1lc4hojzhxxv3bvy3',
    'consumerSecret': 'yd28k8yej9ji1pv15b9velb30jagkm6t',
    'accessToken': 'o228lmnx9wexgng3dc14ukjjz0a0a72a',
    'tokenSecret': 'qk63p5kn0nl07ixjulikvvk70mm8hkuk',
});

async function getOrders () {
  try {
      let { data } = await client.get('products');
      console.log(data)
  } catch (err) {
    console.log('err', err)
      // Error Handling
  }
}
getOrders()