
async function testFetchProducts() {
    try {
        const url = new URL('http://localhost:8000/api/retailer/products');
        url.searchParams.append('type', 'storefront');
        url.searchParams.append('page', '1');
        url.searchParams.append('limit', '4');

        const response = await fetch(url);
        const data = await response.json();

       
    } catch (error) {
        console.log(error);
    }
}

testFetchProducts();
