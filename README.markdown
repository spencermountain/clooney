
clooney makes nice graphs with the [famo.us](http://famo.us) layout engine

it's in early development
here are some demos:

[barchart demo](https://rawgit.com/spencermountain/famo.us_scratch/master/graphs/index.html)

[linechart demo](https://rawgit.com/spencermountain/famo.us_scratch/master/areabar/index.html)

[treemap demo](https://rawgit.com/spencermountain/famo.us_scratch/master/treemap/index.html)


## Use
```javascript
//a generic data format for all graphs
data= [{
	  value:30,
	  label:"Rivest"
	},
	{
	  value:40,
	  label:"Shamir"
	},
	{
	  value:60,
	  label:"Adleman"
  }]
//a generic options format
graph = new Clooney({
	data: data,
	width: 400,
	height: 400,
	type: "horizontal_bar"
})
//get the famo.us container
view = graph.build()
mainContext.add(view)

//then update it..
g.update({
	align:"middle",
	type:"vertical_bar"
})
//the updates automatically animate in a physics transition
```