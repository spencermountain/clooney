
##clooney makes graphs with [famo.us](http://famo.us)

Clooney builds graphs using tons of layout logic from [d3.js](http://d3js.org), and renders them with the [famo.us](http://famo.us) layout engine.

here's [the demo](https://rawgit.com/spencermountain/clooney/master/index.html)

it's in early development. (May 2014)

## Generic Data format
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
```
## Generic Graph APi
```javascript
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

//the to hide it..
g.hide()
```

## all options
```javascript
options= {
	data:[] //objects with a number as 'value'. change any value and it updates intellegently
	width:400//graph container width (and x-axis scale size)
	height:400//graph container height (and y-axis scale size)
	align:"start|middle|end" //start=left for horizontal charts, start=bottom for vertical charts
	type:"horizontal_bar|vertical_bar|area_bar|treemap" //the type of chart
	hidden: true|false //lets you control when it opens/closes
}
```

#Utility methods
they just wrap around 'g.update()', if you wanna use them
```javascript
g= new Clooney()

//show/hide the data
g.hide()
g.show()
//container size
g.resize({width:500})
g.resize({height:0})
//options.align
g.align('start')
g.align('middle')
g.align('end')
//ordering
g.sort()
g.sort(my_sort_method)
g.sort('desc')
g.randomize()//re-arrange randomly

//sugar
g.wave()//wiggle each value in a sequence
g.randomize()//change order at random
g.random_walk()//mindlessly guide things out of order
```

#Direct manipulation
if you're a badass, you can manipulate the graph manually, aswell.
```javascript

g.bars[1].focus()

g.bars[1].height=800
g.bars[1].draw()
```