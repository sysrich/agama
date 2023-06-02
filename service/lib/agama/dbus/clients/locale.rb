# frozen_string_literal: true

# Copyright (c) [2022] SUSE LLC
#
# All Rights Reserved.
#
# This program is free software; you can redistribute it and/or modify it
# under the terms of version 2 of the GNU General Public License as published
# by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
# FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along
# with this program; if not, contact SUSE LLC.
#
# To contact SUSE LLC about this file by physical or electronic mail, you may
# find current contact information at www.suse.com.

require "agama/dbus/clients/base"

module Agama
  module DBus
    module Clients
      # D-Bus client for locale configuration
      class Locale < Base
        def initialize
          super

          @dbus_object = service.object("/org/opensuse/Agama/Locale1")
          @dbus_object.introspect
        end

        def service_name
          @service_name ||= "org.opensuse.Agama.Locale1"
        end

        # Sets the supported locales. It can differs per product.
        #
        # @param locales [Array<String>]
        def supported_locales=(locales)
          dbus_object.supported_locales = locales
        end

        # Finishes the language installation
        def finish
          dbus_object.Commit
        end

        # Registers a callback to run when the selected locales changes
        #
        # @note Signal subscription is done only once. Otherwise, the latest subscription overrides
        #   the previous one.
        #
        # @param block [Proc] Callback to run when a locales are selected
        def on_language_selected(&block)
          on_properties_change(dbus_object) do |_, changes, _|
            languages = changes["Locales"]
            block.call(languages)
          end
        end

      private

        # @return [::DBus::Object]
        attr_reader :dbus_object
      end
    end
  end
end