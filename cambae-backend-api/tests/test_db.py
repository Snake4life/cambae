from app.models import User


def test_user_model(session):
    user = User(
        username="my username",
        email = "email@easdf.dk"
    )
    session.add(user)
    session.commit()

    getuser = User.query.filter_by(username=user.username).first()

    assert getuser.username is user.username
