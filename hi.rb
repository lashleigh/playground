
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
get '/voxels' do
  erb :voxels
end
get '/dla' do
  erb :dla_with_workers
end

get '/application.css' do
  less :application
end
get '/application.js' do
  coffee :application
end
