
get '/' do
  erb :index
end
get '/balls' do
  erb :balls
end
get '/particles' do
  erb :particles
end
get '/flying' do
  erb :flying
end
get '/planets' do
  erb :planets
end
get '/voxel' do
  erb :voxel
end
get '/hello' do
  "Hello, who are you?"
end
get '/hello/devil' do
  "Ahhh, run for your lives!"
end
get '/hello/:name' do
  # matches "GET /hello/foo" and "GET /hello/bar"
  # params[:name] is 'foo' or 'bar'
  @name = params[:name]
  erb :name
end
get '/say/*/to/*' do
  # matches /say/hello/to/world
  params[:splat] # => ["hello", "world"]
end

get '/application.css' do
  less :application
end
get '/application.js' do
  coffee :application
end
