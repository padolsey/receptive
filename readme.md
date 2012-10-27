# Receptive

*Receptive* is, primarily, a DOM-aware template renderer. 

It takes your template, and your template-generating function (e.g. underscore's `_.template`) and enables you to render specific parts of the template to the current DOM representation. It maintains an internal mapping between an element (identified by a selector) and the parts of the template that generate that element.

This means you can utilise template composition as you usually would while also having the luxury that verbose data-binding solutions provide.

## What you normally would do:

Your template might look like this:

```html
<h1>Hi <%=name%></h1>
<h2 class="balance">
  Your balance is <%=balance%>
</h2>
```

You might render the template like this:

```js
someElement.append(
  myTemplateFn({
    name: 'Bob',
    balance: 998
  })
);
```

But what happens when the balance changes and you want to update the DOM?

You have the following options:

 * Select `h2.balance` from the produced DOM, and change its inner-text manually
 * Use a seperate template for the `<h2 class="balance">...</h2>` (*MVC lingo: "use a subview"*)
 * Re-render the entire template and replace the current DOM representation completely

There are also specialised MVC view-model binding solutions available. These usually require you to define a mapping between values and elements, and to specify which attribute has to change on that element.

## Enter... *Receptive*

Receptive recognizes that the above solutions for updating the 'balance' value are not ideal. It recognizes that:

 * You don't want to keep re-rendering the entire DOM representation. It's inefficient and can result in losing user-state, i.e. half-entered text in a textarea, or text that the user has highlighted etc.
 * You don't always want to create numerous sub-views/sub-templates for every miniscule item. You might find this needlessly verbose and complex.
 * You don't want to have to specify manual attribute bindings or manually change specific DOM elements yourself. This is why you wanted to use templates in the first place!

## What does Receptive do?

Receptive allows you to render the template to its DOM representation **once** and then when values subsequently change, it will selectively re-render the relevant parts for you using the original template provided by you.

## It sounds like view-model binding...

It does a bit, yes. But there's a key difference. Typical view-model binding solutions either guess or make you specify how they must change an element's content when a model-value changes. Receptive, on the other hand, will use your template and just re-render the element and then replace the current corresponding element.

## Dependencies

 * jQuery
 * *OPTIONAL* `_.template`. If not detected, you should specify your own template-function generator via `receptive.TEMPLATE_GENERATOR = myFn`

