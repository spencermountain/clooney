class Scale
  constructor:(obj={}) ->
    @size = obj.size || 200
    @range = obj.range || [0, 100]
    if typeof @size=="object" && @size.length #don't do arrays like d3
      @size=@size[1]
  linear: (num) ->
    the= this
    normalised_delta = the.range[1]
    if the.range[0]<0
      normalised_delta+=Math.abs(the.range[0])
      num+=Math.abs(the.range[0])
    else if the.range[0]>0
      normalised_delta= the.range[1] - the.range[0]
    normalised_num= num - the.range[0]
    percentage= normalised_num / normalised_delta
    return percentage * the.size

# x= new Scale({size:500, range:[0, 2014]})
# console.log(x.linear(1014))