javascript:(function(){
  var rawTitle = document.querySelector('h1')?.innerText || document.title;
  var title = encodeURIComponent(rawTitle);
  var url = encodeURIComponent(window.location.href);
  var address = encodeURIComponent(
    document.querySelector('[data-item-id="address"]')?.innerText || 
    document.querySelector('meta[name="description"]')?.content || 
    ''
  );
  var img = encodeURIComponent(
    document.querySelector('meta[property="og:image"]')?.content || 
    document.querySelector('img')?.src || 
    ''
  );
  
  var addUrl = 'https://app.somespai.net/ca/admin?import=1&title=' + title + '&address=' + address + '&web=' + url + '&img=' + img;
  window.open(addUrl, '_blank');
})();