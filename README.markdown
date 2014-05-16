
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
//compute the graph
graph = new Clooney({
	data: data,
	width: 400,
	height: 400,
	type: "horizontal_bar"
})

view = graph.build() //grab the famo.us container
mainContext.add(view)

//then to update it..
g.update({
	align:"middle",
	type:"vertical_bar"
})
//the updates automatically animate in a physics transition
```

## Full docs
```javascript
options= {
	data:[], //objects with a number as 'value'. change any value and it updates intellegently
	width:400,//graph container width (and x-axis scale size)
	height:400,//graph container height (and y-axis scale size)
	align:"start" //start|middle|end  (start=left for horizontal_bar, etc)
	type:"horizontal_bar" // horizontal_bar|vertical_bar|horizontal_area
}

```