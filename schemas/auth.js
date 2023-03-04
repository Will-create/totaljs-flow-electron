NEWSCHEMA('Auth', function(schema) {

	schema.define('login', String, true);
	schema.define('password', String, true);

	schema.action('read', {
		name: 'Read logged user info',
		action: function($) {
			var model = {};
			model.login = PREF.user.login;
			model.password = '';
			$.callback(model);
		}
	});

	schema.action('save', {
		name: 'Save logged user info',
		action: async function($, model) {
			var user = PREF.user;
			user.id = UID();
			user.login = model.login;
			user.password = model.password.sha256(CONF.cookie_secret);
			PREF.set('user', user);

			// Update session
			var session = {};
			session.id = user.id;
			session.expire = NOW.add('1 month');
			$.cookie(CONF.cookie, ENCRYPTREQ($.req, session, CONF.cookie_secret), '1 month');

			var ws = F.findConnection('/api/');
			ws && ws.close();
			$.success();
		}
	});

	schema.action('exec', {
		name: 'exec',
		action: function($, model) {

			if (BLOCKED($, 10)) {
				$.invalid('@(Invalid credentials)');
				return;
			}

			var user = PREF.user;
			if (user.login !== model.login || user.password !== model.password.sha256(CONF.cookie_secret)) {
				$.invalid('@(Invalid credentials)');
				return;
			}

			if (user.raw) {
				delete user.raw;
				PREF.set('user', user);
			}

			var session = {};
			session.id = user.id;
			session.expire = NOW.add('1 month');
			$.cookie(CONF.cookie, ENCRYPTREQ($.req, session, CONF.cookie_secret), '1 month');
			$.success();
		}
	});

	schema.action('logout', {
		name: 'User logout',
		action: function($) {
			$.cookie(CONF.cookie, '');
			$.success();
		}
	});
});