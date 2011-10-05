require 'rubygems'
# If you're using bundler, you will need to add this
require 'bundler/setup'
require 'sinatra'
require 'erb'
require 'less'
require 'mongo'

require './hi'
run Sinatra::Application
