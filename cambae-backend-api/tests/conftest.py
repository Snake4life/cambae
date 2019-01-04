import os

import pytest

from app import create_app
from app.models import db as _db


TEST_DATABASE_URI = os.getenv('TEST_DATABASE_URI', 'postgresql+psycopg2://tester:12345@db/flaskdb_test')


@pytest.fixture(scope='session')
def app(request):
    """ Session wide test 'Flask' application """
    settings_override = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': TEST_DATABASE_URI
    }

    app = create_app('local', settings_override)
    ctx = app.app_context()
    ctx.push()

    yield app

    ctx.pop()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(scope='session')
def db(app, request):
    """ Session-wide test database """
    _db.drop_all()
    _db.app = app
    _db.create_all()

    yield _db

    _db.drop_all()



@pytest.fixture(scope='function')
def session(db, request):
    """ Creates a new database session for a test """
    connection = db.engine.connect()
    transaction = connection.begin()

    options = dict(bind=connection, binds={})
    session = db.create_scoped_session(options=options)

    db.session = session
    yield db.session

    transaction.rollback()
    connection.close()
    session.remove()



