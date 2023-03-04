NEWSCHEMA('Clipboard', function(schema) {

	schema.define('data', String, true);

	schema.action('export', {
		name: 'Export stream',
		action: function($) {
			var id = $.id;
			var item = MAIN.flowstream.db[id];
			if (item)
				$.success(true, JSON.stringify(item));
			else
				$.invalid(404);
		}
	});

	schema.action('import', {
		name: 'Import stream',
		action: function($, model) {

			var data = model.data.parseJSON(true);

			if (!data) {
				$.invalid('@(Invalid data)');
				return;
			}

			data.id = 'f' + UID();

			delete data.unixsocket;
			delete data.directory;
			delete data.size;
			delete data.variables2;
			delete data.origin;

			if (!data.design)
				data.design = {};

			if (!data.components)
				data.components = {};

			if (!data.variables)
				data.variables = {};

			data.dtcreated = NOW;

			if (data.proxypath) {
				var db = MAIN.flowstream.db;
				for (var key in db) {
					if (db[key].proxypath === data.proxypath) {
						data.proxypath = '';
						break;
					}
				}
			}

			delete data.dtupdated;
			MAIN.flowstream.db[data.id] = data;
			MAIN.flowstream.init(data.id, function(err) {
				$.callback({ success: true, value: data.id, error: err ? err.toString() : null });
				MAIN.flowstream.save();
			});
		}
	});
});