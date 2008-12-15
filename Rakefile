require 'rake'
require 'rake/testtask'
require 'rake/rdoctask'

desc "Generates documentation"
task :doc do
  pdoc = 'lib/pdoc/lib/pdoc'
  unless File.exists?(pdoc)
    puts "\nYou'll need PDoc to generate the documentation. Just run:\n\n"
<<<<<<< HEAD:Rakefile
    puts " $ git submodule init"
    puts " $ git submodule update"
=======
    puts "  $ git submodule init"
    puts "  $ git submodule update"
>>>>>>> ZenCocoon/master:Rakefile
    puts "\nand you should be all set.\n\n"
  end
  
  require pdoc
  require 'fileutils'
  require 'tempfile'
  
  output_directory    = 'doc'
  templates_directory = File.join('lib', 'pdoc_templates', 'html')
  javascript_files    = File.join('src', '**', '*.js')
  
  FileUtils.rm_rf(output_directory)
  FileUtils.mkdir_p(output_directory)
  
  temp = Tempfile.new('fx_doc')
  Dir.glob(javascript_files).each do |f|
    temp << "\n" << File.read(f)
  end
  temp.rewind
  
  PDoc::Runner.new(temp.path, :output => output_directory, :templates => templates_directory).run
  temp.close
end


desc "Build all dist files"
task :build => ['build:packed_base', 'build:packed_full'] do
end
desc "Alias for build"
task :dist => :build

DIST_DIRECTORY           = 'dist'
BASE_DIST_FILES          = %w(base/base.js base/attribute.js base/metronome.js util/string.js fx/element.js prototype_ext/element.js)
BASE_DIST_OUTPUT         = File.join(DIST_DIRECTORY, 'protofx_base.js')
PACKED_BASE_DIST_OUTPUT  = File.join(DIST_DIRECTORY, 'protofx_base_packed.js')

FULL_DIST_FILES          = BASE_DIST_FILES + %w(base/transition.js base/score.js)
FULL_DIST_OUTPUT         = File.join(DIST_DIRECTORY, 'protofx.js')
PACKED_FULL_DIST_OUTPUT  = File.join(DIST_DIRECTORY, 'protofx_packed.js')
                         
YUI_COMPRESSOR           = 'java -jar lib/yuicompressor/yuicompressor-2.3.5.jar'

namespace :build do
  def concat_files(files, output)
    FileUtils.mkdir_p(File.dirname(output))
    
    file = File.new(output, 'w')
    files.each do |f|
      file << "\n" << File.read(File.join('src', f))
    end
    file.close
  end
  
  desc "Builds base dist fill (not compressed)"
  task :base do
    concat_files(BASE_DIST_FILES, BASE_DIST_OUTPUT)
  end
  
  desc "Builds base dist fill (compressed by yui compressor)"
  task :packed_base => :base do
    system "#{YUI_COMPRESSOR} #{BASE_DIST_OUTPUT} > #{PACKED_BASE_DIST_OUTPUT}"
  end
  
  desc "Builds full dist fill (not compressed)"
  task :full do
    concat_files(FULL_DIST_FILES, FULL_DIST_OUTPUT)
  end
  
  desc "Builds full dist fill (compressed by yui compressor)"
  task :packed_full => :full do
    system "#{YUI_COMPRESSOR} #{FULL_DIST_OUTPUT} > #{PACKED_FULL_DIST_OUTPUT}"
  end
  
end