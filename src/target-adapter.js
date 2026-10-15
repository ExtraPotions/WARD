EXP.TargetAdapter = EXP.createRetailerModule({
  key:'target', label:'Target', hosts:['www.target.com','target.com'],
  routes:[[/^\/checkout(?:\/|$)/,'checkout'],[/^\/(?:cart|co-cart)(?:\/|$)/,'cart'],[/^\/p\//,'product'],[/^\/(?:s|c)(?:\/|$)/,'search']],
  detectors:[
    { id:'sponsored', patternId:'sponsorship.placement', pages:['home','search','product'], selectors:['[data-test="sponsoredLabel"]','[data-test="sponsored-label"]'], text:/^sponsored$/i },
    { id:'scarcity', patternId:'pressure.scarcity', pages:['product','search','cart'], selectors:['[data-test="low-stock-message"]','[data-test="availabilityMessage"]'], text:/only \d+ left|low stock|almost gone/i },
    { id:'urgency', patternId:'pressure.urgency', pages:['product','search'], selectors:['[data-test="promotion-message"]','[data-test="deal-end-message"]'], text:/limited time|ends? (?:today|soon|in)/i },
    { id:'membership', patternId:'upsell.store-membership', pages:['home','product','cart'], selectors:['[data-test="circle360-promotion"]','[data-test="circle-card-promotion"]'], text:/target circle|circle 360/i, complete:true },
    { id:'financing', patternId:'upsell.financial-product', pages:['product','cart'], selectors:['[data-test="affirm-message"]','[data-test="afterpay-message"]'], text:/affirm|afterpay|pay in/i },
    { id:'recommendations', patternId:'cross-sell.recommendation', pages:['product','cart'], selectors:['[data-test="recommendation-module"]'], complete:true }
  ]
});
EXP.Retailers.register(EXP.TargetAdapter);
