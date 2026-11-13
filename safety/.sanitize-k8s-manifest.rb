require 'yaml'
require 'date'

path = 'k8s/kubernetes.yaml'
source = File.read(path)
parts = source.split(/(?=^---\s*$)/)
kept = []

parts.each do |part|
  document = YAML.safe_load(part, permitted_classes: [Date, Time], aliases: true)
  next unless document

  kind = document['kind']
  name = document.dig('metadata', 'name')
  next if kind == 'Secret'
  next if kind == 'Service' && name == 'discord-bot-service'

  if kind == 'ConfigMap' && name == 'besafe-config'
    part = part.gsub(/^\s*VRC_TOTAL_INSTANCES:.*\n/, '')
    unless part.match?(/^\s*VRC_DISCOVERY_HOST:/)
      part = part.sub(/^(\s*SHARD_COUNT:.*\n)/, "\\1  VRC_DISCOVERY_HOST: \"vrchat-bot-headless.besafe-network.svc.cluster.local\"\n")
    end
  end

  part = part.sub(/\A\s*---\s*\n/, '')
  kept << part.rstrip
end

abort 'Refusing to write an empty manifest' if kept.empty?
File.write(path, kept.join("\n---\n") + "\n")
puts "Removed inline secrets and unused ClusterIP service; retained #{kept.length} resources."
