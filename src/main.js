function calculateSimpleRevenue(purchase, _product) {
   const { discount, sale_price, quantity } = purchase;
   return sale_price * quantity * (1 - discount / 100);
}

function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;

    if (index === total - 1) {
        return 0;
    }

   if (index === 0) {
       return profit * 0.15;
    }

   if (index === 1 || index === 2) {
       return profit * 0.10;
    }

  return profit * 0.05;
};


function analyzeSalesData(data, options) {

    if (!data || typeof data !== "object") {
        throw new Error("Некорректные входные данные");
    };

    if (!Array.isArray(data.purchase_records) ||
        !Array.isArray(data.products) ||
        !Array.isArray(data.sellers)) {
            throw new Error("В data отсутствуют необходимые массивы");
        };
        
    if (!options || typeof options !== "object") {
        throw new Error("Опции должны быть объектом");
    };
    
    const { calculateRevenue, calculateBonus } = options;

    if (!calculateRevenue || !calculateBonus) {
        throw new Error("В опциях отсутствуют необходимые функции");
    };

   if (typeof calculateRevenue !== "function" ||
      typeof calculateBonus !== "function") {
        throw new Error("Опции должны содержать функции");
    };
    
    const sellerStats = data.sellers.map(seller => ({
      seller_id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      top_products: {},
      bonus: 0
    }));


    const sellerIndex = Object.fromEntries(
        sellerStats.map(seller => [seller.seller_id, seller])
    );

    const productIndex = Object.fromEntries(
        data.products.map(product => [product.sku, product])
    );


    data.purchase_records.forEach(receipt => {
        const seller = sellerIndex[receipt.seller_id];
        
        seller.sales_count += 1;
        
        receipt.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;
        
            const revenue = calculateRevenue(item);
            const profit = calculateSimpleRevenue(item, product) - product.purchase_price * item.quantity;

            seller.revenue += revenue;
            seller.profit += profit;

            if (!seller.top_products[item.sku]) {
                seller.top_products[item.sku] = 0;
            }
            
            seller.top_products[item.sku] += item.quantity;
        });
    });
    
    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
    });

    return sellerStats.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        
        sales_count: seller.sales_count,
        
        top_products: Object.entries(seller.top_products)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10),
        
        bonus: +seller.bonus.toFixed(2)
    }));
}
