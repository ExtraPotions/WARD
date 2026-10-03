EXP.BestBuyAdapter = EXP.createRetailerModule({
  key:'bestbuy', label:'Best Buy', hosts:['www.bestbuy.com','bestbuy.com'],
  routes:[[/^\/checkout(?:\/|$)/,'checkout'],[/^\/cart(?:\/|$)/,'cart'],[/^\/site\/[^/]+\/\d+\.p$/,'product'],[/^\/site\/searchpage\.jsp$/,'search']],
  detectors:[
    { id:'sponsored', patternId:'sponsorship.placement', pages:['home','search','product'], selectors:['.sponsored-label','[data-testid="sponsored-label"]'], text:/^sponsored$/i },
    { id:'scarcity', patternId:'pressure.scarcity', pages:['product','search'], selectors:['.availability-message','[data-testid="low-stock-message"]'], text:/only \d+ left|low stock|almost gone/i },
    { id:'urgency', patternId:'pressure.urgency', pages:['product','search'], selectors:['.offer-end-date','.deal-ending'], text:/limited time|ends? (?:today|soon|in)/i },
    { id:'membership', patternId:'upsell.store-membership', pages:['home','product','cart'], selectors:['.my-best-buy-membership-promotion','[data-testid="membership-promotion"]'], text:/my best buy|membership|total|plus/i, complete:true },
    { id:'financing', patternId:'upsell.financial-product', pages:['product','cart'], selectors:['.financing-offer','.credit-card-offer'], text:/financing|credit card|monthly|payments/i },
    { id:'protection', patternId:'upsell.protection-plan', pages:['product','cart'], selectors:['.gsp-offer','[data-testid="protection-plan-promotion"]'], text:/protection|geek squad/i },
    { id:'recommendations', patternId:'cross-sell.recommendation', pages:['product','cart'], selectors:['.recommendation-carousel','.shop-related-items'], complete:true },
    { id:'reference-price', patternId:'pricing.reference-price', pages:['product','search'], selectors:['.pricing-price__regular-price'] }
  ]
});
EXP.Retailers.register(EXP.BestBuyAdapter);
