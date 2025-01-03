"""empty message

Revision ID: dc55a2105145
Revises: ad0d9cd0aef2
Create Date: 2024-12-30 21:54:52.132988

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'dc55a2105145'
down_revision = 'ad0d9cd0aef2'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('uploaded_file',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('session_id', sa.String(length=100), nullable=False),
    sa.Column('filename', sa.String(length=255), nullable=False),
    sa.Column('file_url', sa.String(length=500), nullable=False),
    sa.Column('timestamp', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('uploaded_file')
    # ### end Alembic commands ###
