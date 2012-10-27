function htmlEqual(a, b) {
  a = a.toLowerCase().replace(/[\r\n]/g,'');
  b = b.toLowerCase().replace(/[\r\n]/g,'');
  // IE replace things like `class="f"` with `class=f`, so let's just
  // do it, by default, in the comparee string
  a = a.replace(/="([^"]+)"/g, '=$1');
  b = b.replace(/="([^"]+)"/g, '=$1');
  return equal(a, b); // IE caps <TAGs>s
}

test('receptive.ReceptiveDOM instance properties', function() {
  var r = new receptive.ReceptiveDOM('<span><%=foo%>', {foo:1,bar:[1,2,3]}, {foo:'span'});
  equal(r.template, '<span><%=foo%>');
  deepEqual(r.data, {foo:1,bar:[1,2,3]});
  deepEqual(r.bindings, {foo:'span'});
  equal(r.templateFn({foo:'x'}), '<span>x');
});

module('Bindings');

test('Default binding: *', function() {
  var r = receptive.fromTemplate('<div><%=x%></div><span><%=y%></span>');
  equal(r.defaultBinding, '*');
  r.render({x: 1, y: 2});
  htmlEqual(r.$el.html(), '<div>1</div><span>2</span>');
  var div = r.$el.find('div')[0];
  var span = r.$el.find('span')[0];
  r.set({x: 999}); // No binding for x, so everything is updated:
  htmlEqual(r.$el.html(), '<div>999</div><span>2</span>');
  notEqual(span, r.$el.find('span')[0]);
  notEqual(div, r.$el.find('div')[0]);
});

test('Bindings -- singular selectors', function() {
  var r = receptive.fromTemplate(
    '<div><%=x%> and <%=foo%></div><span><%=y%> and <%=foo%></span>',
    {x: 13, y: 14, foo: 'thing123'},
    {foo: 'div,span', x: 'div'}
  );
  var div = r.$el.find('div')[0];
  var span = r.$el.find('span')[0];

  r.set({x: 99});
  // Only DIV should be different:
  equal(span, r.$el.find('span')[0]); 
  notEqual(div, r.$el.find('div')[0]); 

  r.set({foo: 88});
  // Both should have been updated:
  notEqual(span, r.$el.find('span')[0]); 
  notEqual(div, r.$el.find('div')[0]); 

  htmlEqual(r.$el.html(), '<div>99 and 88</div><span>14 and 88</span>');
});

module('Misc templates');

test('Renders a no-logic template', function() {

  var html = '<div id="x" style="color:red;"><span>Foo</span></div><h1>H<em>i</em></h1>';
  
  var r = receptive.fromTemplate(html);

  r.render();

  htmlEqual(r.$el.html(), html);

});

test('Renders a simple template with echoes', function() {

  var tmpl = '<h1<%=isTitle?" class=title":""%>><%=text%></h1>';
  
  var r = receptive.fromTemplate(tmpl);

  r.render({ isTitle: false, text: 'Bar' });
  htmlEqual(r.$el.html(), '<h1>Bar</h1>');

  r.render({ isTitle: true, text: 'Bar' });
  htmlEqual(r.$el.html(), '<h1 class="title">Bar</h1>');

  r.bindings.text = 'h1';
  r.set({ text: 'Thing' });
  htmlEqual(r.$el.html(), '<h1 class="title">Thing</h1>');

});

test('Updates template by only mutating specific els', function() {

  var tmpl = '<h1><%=title%></h1><h2><%=subTitle%></h2>';
  
  // Setup with binding to subTitle (so it knows to only change h2)
  var r = receptive.fromTemplate(tmpl, {}, {subTitle:'h2'});

  r.render({ title: 'Xx', subTitle: 'Yy' });
  htmlEqual(r.$el.html(), '<h1>Xx</h1><h2>Yy</h2>');

  var h1 = r.$el.find('h1')[0];

  r.set('subTitle', 'Bb');

  htmlEqual(r.$el.html(), '<h1>Xx</h1><h2>Bb</h2>');
  equal(h1, r.$el.find('h1')[0]); // h1 has not been removed

});